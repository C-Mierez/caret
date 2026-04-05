import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { optimisticUpdateFileCache } from "./optimistic-update-cache";

export default function useFilesCreateFolder() {
	return useMutation(api.files.createFolder).withOptimisticUpdate(
		(localStore, args) => {
			const { projectId, name, parentId } = args;
			const now = Date.now();

			const newFolder = {
				_id: crypto.randomUUID() as Id<"files">,
				_creationTime: now,
				projectId,
				name,
				parentId,
				type: "folder" as const,
				updatedAt: now,
			} satisfies Doc<"files">;

			optimisticUpdateFileCache(
				localStore,
				projectId,
				newFolder,
				parentId,
			);
		},
	);
}
