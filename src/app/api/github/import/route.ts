import { auth, clerkClient } from "@clerk/nextjs/server";
import { api } from "@convex/_generated/api";
import { parseGithubUrl } from "@lib/github/github-utils";
import { githubImportRequestSchema } from "@lib/schemas/github/import";
import { getMachineConvexClient } from "@lib/server/convex";
import { GithubImportEvent } from "@modules/projects/inngest/events";
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

	const parsedRequest = githubImportRequestSchema.safeParse(
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

	const { url } = parsedRequest.data;

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

	// Create a new project for the import and get the projectId
	const { mintServiceToken } = await import("@lib/server/service-token");
	const serviceToken = await mintServiceToken("inngest-conversation-worker");
	const convexClient = await getMachineConvexClient(serviceToken);

	const projectId = await convexClient.mutation(api.system.projects.create, {
		name: repo,
		ownerId: userId,
	});

	// Inngest background job
	const event = await inngest.send(
		GithubImportEvent.create({
			owner,
			repo,
			githubToken,
			projectId,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
