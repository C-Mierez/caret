import { auth, clerkClient } from "@clerk/nextjs/server";
import { githubExportRequestSchema } from "@lib/schemas/github/export";
import { GithubExportEvent } from "@modules/projects/inngest/events";
import { NextResponse } from "next/server";
import { Octokit } from "octokit";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({
			error: "Unauthorized",
			status: 401,
		});
	}

	const parsedRequest = githubExportRequestSchema.safeParse(
		await request.json(),
	);

	if (!parsedRequest.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{
				status: 400,
			},
		);
	}

	const { projectId, repositoryName, description, visibility } =
		parsedRequest.data;

	const client = await clerkClient();
	const tokens = await client.users.getUserOauthAccessToken(userId, "github");

	const githubToken = tokens.data[0]?.token;

	if (!githubToken) {
		return NextResponse.json(
			{ error: "GitHub account not linked" },
			{
				status: 400,
			},
		);
	}

	const octokit = new Octokit({ auth: githubToken });
	const { data: authenticatedUser } =
		await octokit.rest.users.getAuthenticated();

	// Preflight: fail early if repository already exists on the authenticated account.
	try {
		await octokit.rest.repos.get({
			owner: authenticatedUser.login,
			repo: repositoryName,
		});

		return NextResponse.json(
			{
				error: `Repository '${repositoryName}' already exists on your GitHub account. Choose a different name.`,
				retryable: false,
			},
			{ status: 409 },
		);
	} catch (error) {
		const status =
			typeof error === "object" &&
			error !== null &&
			"status" in error &&
			typeof error.status === "number"
				? error.status
				: undefined;

		if (status !== 404) {
			console.error("Failed to verify repository availability", error);
			return NextResponse.json(
				{
					error: "Unable to validate repository availability on GitHub.",
					retryable: true,
				},
				{ status: 502 },
			);
		}
	}

	// Inngest background job
	const event = await inngest.send(
		GithubExportEvent.create({
			projectId,
			owner: authenticatedUser.login,
			repo: repositoryName,
			githubToken,
			description,
			visibility,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
