import { auth } from "@clerk/nextjs/server";
import { messagesRequestSchema } from "@lib/schemas/ai/messages";
import { ConversationMessagesSentEvent } from "@modules/conversation/inngest/events";
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

	const parsedRequest = messagesRequestSchema.safeParse(await request.json());

	if (!parsedRequest.success) {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{
				status: 400,
			},
		);
	}

	const { conversationId, message } = parsedRequest.data;

	// Create a background job to process the message and generate a response
	const event = await inngest.send(
		ConversationMessagesSentEvent.create({
			conversationId,
			message,
		}),
	);

	return NextResponse.json(
		{ success: true, eventId: event.ids[0] },
		{ status: 202 },
	);
}
