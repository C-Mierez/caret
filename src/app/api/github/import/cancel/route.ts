import { auth } from "@clerk/nextjs/server";
import { parseGithubUrl } from "@lib/github/github-utils";
import { githubImportCancelRequestSchema } from "@lib/schemas/github/cancel";
import { GithubImportCancelledEvent } from "@modules/projects/inngest/events";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json({
			error: "Unauthorized",
			status: 401,
		});
	}

	const parsedRequest = githubImportCancelRequestSchema.safeParse(
		await request.json(),
	);

	if (!parsedRequest.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const { projectId, url } = parsedRequest.data;
	const { owner, repo } = parseGithubUrl(url);

	const event = await inngest.send(
		GithubImportCancelledEvent.create({
			owner,
			repo,
			projectId,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
