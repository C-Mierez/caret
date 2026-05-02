import { z } from "zod";

export const messagesRequestSchema = z.object({
	conversationId: z.string(),
	message: z.string(),
});

export const messagesResponseSchema = z.object({
	responseMessage: z
		.string()
		.describe("The AI's response to the input message"),
});

export type MessagesRequest = z.infer<typeof messagesRequestSchema>;
export type MessagesResponse = z.infer<typeof messagesResponseSchema>;

export const messagesCancelRequestSchema = z.object({
	conversationId: z.string(),
});

export type MessagesCancelRequest = z.infer<typeof messagesCancelRequestSchema>;
