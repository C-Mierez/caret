import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getMachineConvexClient } from "@lib/server/convex";
import { NonRetriableError } from "inngest";
import type { z } from "zod";
import { inngest } from "@/inngest/client";
import {
	ConversationMessagesCancelledEvent,
	ConversationMessagesSentEvent,
} from "./events";
import { CODING_AGENT_SYSTEM_PROMPT } from "./prompts";

async function finalizeConversationMessages(options: {
	conversationId: string;
	status: "failed" | "cancelled";
	content: string;
	serviceToken: string;
}) {
	const convexClient = await getMachineConvexClient(options.serviceToken);

	return await convexClient.mutation(api.system.finalizePendingMessages, {
		conversationId: options.conversationId as Id<"conversations">,
		status: options.status,
		content: options.content,
	});
}

export const messagesCancelled = inngest.createFunction(
	{
		id: "messages-cancelled",
		triggers: { event: ConversationMessagesCancelledEvent },
	},
	async ({ event, step }) => {
		console.log("Processing message cancellation event", event.data);

		const serviceToken = await step.run("mint-service-token", async () => {
			const { mintServiceToken } = await import(
				"@lib/server/service-token"
			);
			return await mintServiceToken("inngest-conversation-worker");
		});

		await step.run("finalize-cancelled-messages", async () => {
			await finalizeConversationMessages({
				conversationId: event.data.conversationId,
				content: "Request cancelled.",
				serviceToken,
				status: "cancelled",
			});
		});

		return { success: true };
	},
);

export const messagesSent = inngest.createFunction(
	{
		id: "messages-sent",
		triggers: { event: ConversationMessagesSentEvent },
		throttle: { limit: 3, period: "1m" },
		cancelOn: [
			{
				event: ConversationMessagesCancelledEvent,
				if: "event.data.conversationId == async.data.conversationId",
			},
		],
		onFailure: async ({ event, error, step }) => {
			console.error("Failure processing message sent event", {
				error,
				eventData: event.data,
			});

			const { conversationId, message } = event.data.event
				.data as z.infer<typeof ConversationMessagesSentEvent.schema>;

			await step.run("finalize-failed-messages", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				await finalizeConversationMessages({
					conversationId,
					content: `Failed to process message: ${message}\n\nError: ${error.message}`,
					serviceToken,
					status: "failed",
				});
			});
		},
	},
	async ({ event, step }) => {
		console.log("Processing message sent event", event.data);

		const serviceToken = await step.run("mint-service-token", async () => {
			const { mintServiceToken } = await import(
				"@lib/server/service-token"
			);
			return await mintServiceToken("inngest-conversation-worker");
		});

		const { conversation } = await step.run("get-messages", async () => {
			const convexClient = await getMachineConvexClient(serviceToken);

			const conversation = await convexClient.query(
				api.system.getConversationById,
				{
					conversationId: event.data
						.conversationId as Id<"conversations">,
				},
			);

			if (!conversation) {
				throw new NonRetriableError("Conversation not found");
			}

			return { conversation };
		});

		await step.run("finalize-pending-messages", async () => {
			await finalizeConversationMessages({
				conversationId: event.data.conversationId as string,
				content: "Request superseded by a new message.",
				serviceToken,
				status: "cancelled",
			});
		});

		const { assistantMessageId, recentMessages } = await step.run(
			"create-messages",
			async () => {
				const convexClient = await getMachineConvexClient(serviceToken);

				// Create a use message for the conversation
				const [userMessageId, assistantMessageId, recentMessages] =
					await Promise.all([
						convexClient.mutation(api.system.createMessage, {
							content: event.data.message,
							conversationId: event.data
								.conversationId as Id<"conversations">,
							projectId: conversation.projectId,
							sender: "user",
							status: "sent",
						}),
						convexClient.mutation(api.system.createMessage, {
							content: "",
							conversationId: event.data
								.conversationId as Id<"conversations">,
							projectId: conversation.projectId,
							sender: "assistant",
							status: "pending",
						}),
						convexClient.query(api.system.getRecentMessages, {
							conversationId: event.data
								.conversationId as Id<"conversations">,
							limit: 10,
						}),
					]);

				return { userMessageId, assistantMessageId, recentMessages };
			},
		);

		await step.run("build-system-prompt", async () => {
			let systemPrompt = CODING_AGENT_SYSTEM_PROMPT;

			const contextMessages = recentMessages.filter(
				(message) =>
					message._id !== assistantMessageId &&
					message.status === "sent" &&
					message.content.trim() !== "",
			);

			if (contextMessages.length > 0) {
				const contextPrompt = contextMessages
					.map((message) => `${message.sender}: ${message.content}`)
					.join("\n\n");
				systemPrompt += `\n\n## Previous Conversation (for context only - do NOT repeat these responses):\n${contextPrompt}\n\n## Current Request:\nRespond ONLY to the user's new message below. Do not repeat or reference your previous responses.`;
			}
		});

		return { success: true, conversation };
	},
);
