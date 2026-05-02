"use client";

import { Button } from "@components/ui/button";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { ModalProps } from "@hooks/use-modal";
import useModalHandler from "@hooks/use-modal-handler";
import { cn } from "@lib/utils";
import { CheckIcon } from "lucide-react";
import ResponsiveModal from "@/components/modals/responsive-modal";

interface Props extends ModalProps {
	activeConversationId: Id<"conversations"> | null;
	conversations: Doc<"conversations">[];
	onSelect: (conversationId: Id<"conversations">) => void;
}

export function PastConversationsDialog({
	activeConversationId,
	conversations,
	onSelect,
	...modalProps
}: Props) {
	const { closeModalSafe, onOpenChange } = useModalHandler({
		onOpenChange: modalProps.onOpenChange,
	});

	return (
		<ResponsiveModal
			{...{
				...modalProps,
				onOpenChange,
			}}
			className="max-w-md"
			header={
				<div className="flex flex-col gap-1 text-left">
					<span className="font-semibold text-base">
						Past conversations
					</span>
					<span className="text-muted-foreground text-sm">
						Switch to a previous conversation in this project.
					</span>
				</div>
			}
		>
			<div className="flex max-h-[60vh] flex-col gap-2 overflow-y-auto pr-1">
				{conversations.length === 0 ? (
					<p className="rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
						No conversations yet.
					</p>
				) : (
					conversations.map((conversation) => {
						const isActive =
							conversation._id === activeConversationId;

						return (
							<Button
								key={conversation._id}
								variant="outline"
								className={cn(
									"h-auto justify-between rounded-xl p-3 text-left",
									isActive && "border-foreground bg-muted",
								)}
								onClick={() => {
									onSelect(conversation._id);
									closeModalSafe();
								}}
							>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium text-sm">
										{conversation.title}
									</p>
									<p className="text-muted-foreground text-xs">
										Updated{" "}
										{new Date(
											conversation.updatedAt,
										).toLocaleString()}
									</p>
								</div>
								{isActive && (
									<CheckIcon className="size-4 shrink-0" />
								)}
							</Button>
						);
					})
				)}
			</div>
		</ResponsiveModal>
	);
}
