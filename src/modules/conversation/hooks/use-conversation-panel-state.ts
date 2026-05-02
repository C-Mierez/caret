"use client";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { API_URLS } from "@lib/urls";
import { DEFAULT_CONVERSATION_TITLE } from "@modules/conversation/constants";
import useConversationCreate from "@modules/conversation/hooks/use-conversation-create";
import { useQuery } from "convex/react";
import ky from "ky";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { PromptInputMessage } from "@/components/ai-elements/prompt-input";
import { useConversationsGetOwnedByProject } from "@/hoc/conversations-getOwnedByProject";

interface Props {
	projectId: string;
}

const OPTIMISTIC_UUID_REGEX =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isPersistedConversationId(conversationId: Id<"conversations">) {
	return !OPTIMISTIC_UUID_REGEX.test(conversationId);
}

export default function useConversationPanelState({ projectId }: Props) {
	const { preloadedResult: conversations } =
		useConversationsGetOwnedByProject();
	const [input, setInput] = useState("");
	const [selectedConversationId, setSelectedConversationId] =
		useState<Id<"conversations"> | null>(null);
	const createConversationMutation = useConversationCreate();

	const sortedConversations = useMemo(
		() => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
		[conversations],
	);

	const latestPersistedConversationId = useMemo(
		() =>
			sortedConversations.find((conversation) =>
				isPersistedConversationId(conversation._id),
			)?._id ?? null,
		[sortedConversations],
	);

	const activeConversationId =
		selectedConversationId &&
		isPersistedConversationId(selectedConversationId)
			? selectedConversationId
			: latestPersistedConversationId;

	const activeConversation = useMemo(
		() =>
			sortedConversations.find(
				(conversation) => conversation._id === activeConversationId,
			),
		[activeConversationId, sortedConversations],
	);

	const conversationMessages =
		useQuery(
			api.conversations.getMessagesByConversation,
			activeConversationId
				? {
						conversationId: activeConversationId,
					}
				: "skip",
		) ?? [];

	const isProcessing = conversationMessages.some(
		(message) => message.status === "pending",
	);

	const handleCancel = useCallback(async () => {
		if (!activeConversationId) {
			return;
		}

		try {
			await ky.post(API_URLS.messages.cancel, {
				json: { conversationId: activeConversationId },
			});
		} catch {
			toast.error("Unable to cancel request");
		}
	}, [activeConversationId]);

	const createConversation = useCallback(async () => {
		try {
			const newConversationId = await createConversationMutation({
				projectId: projectId as Id<"projects">,
				title: DEFAULT_CONVERSATION_TITLE,
			});

			if (!newConversationId) {
				return null;
			}

			setSelectedConversationId(newConversationId);
			toast.success("New conversation created");
			return newConversationId;
		} catch {
			toast.error("Unable to create new conversation");
			return null;
		}
	}, [createConversationMutation, projectId]);

	// Send a new message
	// Create a new conversation if there isn't an active one
	const submitMessage = useCallback(
		async (message: PromptInputMessage) => {
			if (isProcessing && !message.text) {
				await handleCancel();
				setInput("");
				return;
			}

			let conversationId = activeConversationId;

			if (!conversationId) {
				const newConversationId = await createConversation();
				if (!newConversationId) {
					return;
				}

				conversationId = newConversationId;
			}

			try {
				await ky.post(API_URLS.messages.create, {
					json: {
						conversationId,
						message: message.text,
					},
				});
			} catch {
				toast.error("Message failed to send");
			}

			setInput("");
		},
		[activeConversationId, createConversation, handleCancel, isProcessing],
	);

	const copyMessage = useCallback(async (content: string) => {
		try {
			await navigator.clipboard.writeText(content);
		} catch {
			toast.error("Unable to copy message");
		}
	}, []);

	return {
		activeConversationId,
		activeConversationTitle: activeConversation?.title,
		conversationMessages,
		conversations: sortedConversations,
		copyMessage,
		createConversation,
		input,
		isProcessing,
		selectConversation: (conversationId: Id<"conversations">) => {
			setSelectedConversationId(conversationId);
		},
		setInput,
		submitMessage,
	};
}
