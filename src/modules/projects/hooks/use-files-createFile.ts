import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { optimisticUpdateFileCache } from "./optimistic-update-cache";

export default function useFilesCreateFile() {
	return useMutation(api.files.createFile).withOptimisticUpdate(
		(localStore, args) => {
			const { projectId, content, name, parentId } = args;
			const now = Date.now();

			const newFile = {
				_id: crypto.randomUUID() as Id<"files">,
				_creationTime: now,
				projectId,
				content,
				name,
				parentId,
				type: "file" as const,
				updatedAt: now,
			} satisfies Doc<"files">;

			optimisticUpdateFileCache(localStore, projectId, newFile, parentId);
		},
	);
}
