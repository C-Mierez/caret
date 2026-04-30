import { eventType } from "inngest";
import { z } from "zod";
import { InngestEvent } from "@/inngest/events";

const ConversationMessagesSentSchema = z.object({
	conversationId: z.string(),
	message: z.string(),
});

const ConversationMessagesCancelledSchema = z.object({
	conversationId: z.string(),
});

export const ConversationMessagesSentEvent = eventType(
	InngestEvent.ConversationMessagesSent,
	{
		schema: ConversationMessagesSentSchema,
	},
);

export const ConversationMessagesCancelledEvent = eventType(
	InngestEvent.ConversationMessagesCancelled,
	{
		schema: ConversationMessagesCancelledSchema,
	},
);
