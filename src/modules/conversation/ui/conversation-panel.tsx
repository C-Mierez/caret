"use client";

import useModal from "@hooks/use-modal";
import useConversationPanelState from "@modules/conversation/hooks/use-conversation-panel-state";
import { CopyIcon, HistoryIcon, LoaderIcon, PlusIcon } from "lucide-react";
import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
	Message,
	MessageAction,
	MessageActions,
	MessageContent,
	MessageResponse,
} from "@/components/ai-elements/message";
import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	PromptInputSubmit,
	PromptInputTextarea,
	PromptInputTools,
} from "@/components/ai-elements/prompt-input";
import { Button } from "@/components/ui/button";
import { PastConversationsDialog } from "./past-conversations-dialog";

interface Props {
	projectId: string;
}

export default function ConversationPanel({ projectId }: Props) {
	const {
		activeConversationId,
		activeConversationTitle,
		conversationMessages,
		conversations,
		copyMessage,
		createConversation,
		input,
		isProcessing,
		selectConversation,
		setInput,
		submitMessage,
	} = useConversationPanelState({ projectId });
	const pastConversationsModal = useModal();

	return (
		<>
			<PastConversationsDialog
				{...pastConversationsModal}
				activeConversationId={activeConversationId}
				conversations={conversations}
				onSelect={selectConversation}
			/>
			<aside className="flex h-full flex-col bg-background">
				<header className="flex h-subheader items-center justify-between border-b">
					<div className="line-clamp-1 flex-1 truncate pl-3 text-sm">
						{activeConversationTitle ?? "No conversation selected"}
					</div>
					<div className="flex items-center gap-1 px-1">
						<Button
							size="icon-xs"
							variant={"ghost"}
							onClick={pastConversationsModal.openModal}
						>
							<HistoryIcon className="size-4" />
						</Button>
						<Button
							size="icon-xs"
							variant={"ghost"}
							onClick={createConversation}
						>
							<PlusIcon className="size-4" />
						</Button>
					</div>
				</header>

				<Conversation className="flex-1">
					<ConversationContent>
						{conversationMessages.length === 0 ? (
							<ConversationEmptyState />
						) : (
							conversationMessages.map(
								(message, messageIndex) => (
									<Message
										key={message._id}
										from={message.sender}
									>
										<MessageContent>
											{message.status === "pending" ? (
												<div className="flex flex-col gap-2">
													{message.content ? (
														<MessageResponse>
															{message.content}
														</MessageResponse>
													) : null}
													<div className="flex items-center gap-2 text-muted-foreground">
														<LoaderIcon className="size-4 animate-spin" />
														<span>
															{message.sender ===
															"assistant"
																? "Thinking..."
																: "Sending..."}
														</span>
													</div>
												</div>
											) : message.status === "failed" ? (
												<span className="text-muted-foreground italic">
													Message failed
												</span>
											) : (
												<MessageResponse>
													{message.content}
												</MessageResponse>
											)}
										</MessageContent>
										{message.sender === "assistant" &&
											message.status === "sent" &&
											messageIndex ===
												conversationMessages.length -
													1 && (
												<MessageActions>
													<MessageAction
														onClick={() => {
															void copyMessage(
																message.content,
															);
														}}
														label="Copy"
													>
														<CopyIcon className="size-3" />
													</MessageAction>
												</MessageActions>
											)}
									</Message>
								),
							)
						)}
					</ConversationContent>
					<ConversationScrollButton />
				</Conversation>

				<PromptInput onSubmit={submitMessage} className="mt-2 p-2">
					<PromptInputBody>
						<PromptInputTextarea
							className="text-foreground placeholder:text-muted-foreground"
							placeholder="Ask Caret anything..."
							onChange={(e) => setInput(e.target.value)}
							value={input}
							disabled={isProcessing}
						/>
					</PromptInputBody>
					<PromptInputFooter>
						<PromptInputTools />
						<PromptInputSubmit
							disabled={isProcessing ? false : !input}
							status={isProcessing ? "streaming" : undefined}
						/>
					</PromptInputFooter>
				</PromptInput>
			</aside>
		</>
	);
}
