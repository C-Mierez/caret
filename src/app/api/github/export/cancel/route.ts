import { auth } from "@clerk/nextjs/server";
import { githubExportCancelRequestSchema } from "@lib/schemas/github/cancel";
import { GithubExportCancelledEvent } from "@modules/projects/inngest/events";
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

	const parsedRequest = githubExportCancelRequestSchema.safeParse(
		await request.json(),
	);

	if (!parsedRequest.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}

	const { projectId } = parsedRequest.data;

	const event = await inngest.send(
		GithubExportCancelledEvent.create({
			projectId,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
