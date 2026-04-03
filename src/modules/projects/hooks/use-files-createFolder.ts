import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

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
				type: "folder",
				updatedAt: now,
			} satisfies Doc<"files">;

			const cachedQuery = localStore.getQuery(api.files.getOwnedSorted, {
				projectId,
				parentId,
			});

			if (cachedQuery !== undefined) {
				const sortedFiles = [...cachedQuery, newFolder].sort((a, b) => {
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

			const allFilesCachedQuery = localStore.getQuery(
				api.files.getOwnedAll,
				{
					projectId,
				},
			);

			if (allFilesCachedQuery !== undefined) {
				localStore.setQuery(api.files.getOwnedAll, { projectId }, [
					...allFilesCachedQuery,
					newFolder,
				]);
			}
		},
	);
}
