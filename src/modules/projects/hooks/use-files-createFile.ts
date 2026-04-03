import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

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
				type: "file",
				updatedAt: now,
			} satisfies Doc<"files">;

			// Optimistic update for files.getOwnedSorted
			const cachedQuery = localStore.getQuery(api.files.getOwnedSorted, {
				projectId,
				parentId,
			});

			if (cachedQuery !== undefined) {
				const sortedFiles = [...cachedQuery, newFile].sort((a, b) => {
					if (a.type === "folder" && b.type === "file") return -1;
					if (a.type === "file" && b.type === "folder") return 1;

					return a.name.localeCompare(b.name);
				});

				localStore.setQuery(
					api.files.getOwnedSorted,
					{ projectId, parentId },
					sortedFiles,
				);
			}

			// Optimistic update for files.getOwnedAll
			const allFilesCachedQuery = localStore.getQuery(
				api.files.getOwnedAll,
				{
					projectId,
				},
			);

			if (allFilesCachedQuery !== undefined) {
				localStore.setQuery(api.files.getOwnedAll, { projectId }, [
					...allFilesCachedQuery,
					newFile,
				]);
			}
		},
	);
}
