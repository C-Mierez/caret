import { auth } from "@clerk/nextjs/server";
import { messagesCancelRequestSchema } from "@lib/schemas/ai/messages";
import { ConversationMessagesCancelledEvent } from "@modules/conversation/inngest/events";
import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(request: Request) {
	const { userId } = await auth();

	if (!userId) {
		return NextResponse.json(
			{ error: "Unauthorized" },
			{
				status: 401,
			},
		);
	}

	const parsedRequest = messagesCancelRequestSchema.safeParse(
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

	const { conversationId } = parsedRequest.data;

	// Create a background job to process the message and generate a response
	const event = await inngest.send(
		ConversationMessagesCancelledEvent.create({
			conversationId: conversationId,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
