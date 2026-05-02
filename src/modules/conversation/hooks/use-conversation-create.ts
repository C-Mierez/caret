import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

export default function useConversationCreate() {
	return useMutation(api.conversations.create).withOptimisticUpdate(
		(localStore, args) => {
			const now = Date.now();
			const newConversation = {
				_id: crypto.randomUUID() as Id<"conversations">,
				_creationTime: now,
				projectId: args.projectId,
				title: args.title,
				updatedAt: now,
			} satisfies Doc<"conversations">;

			const cachedQuery = localStore.getQuery(
				api.conversations.getOwnedByProject,
				{ projectId: args.projectId },
			);

			if (cachedQuery !== undefined) {
				localStore.setQuery(
					api.conversations.getOwnedByProject,
					{ projectId: args.projectId },
					[newConversation, ...cachedQuery],
				);
			}
		},
	);
}
