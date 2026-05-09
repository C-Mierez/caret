import { auth, clerkClient } from "@clerk/nextjs/server";
import { parseGithubUrl } from "@lib/github/github-utils";
import { githubExportRequestSchema } from "@lib/schemas/github/export";
import { GithubExportEvent } from "@modules/projects/inngest/events";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export default async function POST(request: Request) {
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

	const { projectId, url } = parsedRequest.data;

	const { owner, repo } = parseGithubUrl(url);

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

	// Inngest background job
	const event = await inngest.send(
		GithubExportEvent.create({
			projectId,
			owner,
			repo,
			githubToken,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
