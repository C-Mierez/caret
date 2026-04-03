import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";

/**
 * Shared optimistic-update helper for file/folder creation.
 * Handles sorting (folders first, then alphabetic) and cache updates for both queries.
 */
export function optimisticUpdateFileCache(
	localStore: OptimisticLocalStore,
	projectId: Id<"projects">,
	newItem: Doc<"files">,
	parentId: Id<"files"> | undefined,
) {
	// Sort function: folders first, then alphabetic by name
	const sortByTypeAndName = (a: Doc<"files">, b: Doc<"files">) => {
		if (a.type === "folder" && b.type === "file") return -1;
		if (a.type === "file" && b.type === "folder") return 1;
		return a.name.localeCompare(b.name);
	};

	// Update getOwnedSorted cache for the specific parent
	const cachedQuery = localStore.getQuery(api.files.getOwnedSorted, {
		projectId,
		parentId,
	});

	if (cachedQuery !== undefined) {
		const sortedFiles = [...cachedQuery, newItem].sort(sortByTypeAndName);
		localStore.setQuery(
			api.files.getOwnedSorted,
			{ projectId, parentId },
			sortedFiles,
		);
	}

	// Update getOwnedAll cache for the project
	const allFilesCachedQuery = localStore.getQuery(api.files.getOwnedAll, {
		projectId,
	});

	if (allFilesCachedQuery !== undefined) {
		localStore.setQuery(api.files.getOwnedAll, { projectId }, [
			...allFilesCachedQuery,
			newItem,
		]);
	}
}
