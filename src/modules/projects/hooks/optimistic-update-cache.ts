import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { OptimisticLocalStore } from "convex/browser";

function sortFilesByTypeAndName(a: Doc<"files">, b: Doc<"files">) {
	if (a.type === "folder" && b.type === "file") return -1;
	if (a.type === "file" && b.type === "folder") return 1;

	return a.name.localeCompare(b.name);
}

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
	// Update getOwnedSorted cache for the specific parent
	const cachedQuery = localStore.getQuery(api.files.getOwnedSorted, {
		projectId,
		parentId,
	});

	if (cachedQuery !== undefined) {
		const sortedFiles = [...cachedQuery, newItem].sort(
			sortFilesByTypeAndName,
		);
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

export function optimisticRenameFileCache(
	localStore: OptimisticLocalStore,
	fileId: Id<"files">,
	newName: string,
	updatedAt: number,
) {
	for (const cachedQuery of localStore.getAllQueries(
		api.files.getOwnedSorted,
	)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		const updatedFiles = cachedQuery.value.map((file) =>
			file._id === fileId
				? {
						...file,
						name: newName,
						updatedAt,
					}
				: file,
		);

		if (updatedFiles !== cachedQuery.value) {
			localStore.setQuery(
				api.files.getOwnedSorted,
				cachedQuery.args,
				updatedFiles.sort(sortFilesByTypeAndName),
			);
		}
	}

	for (const cachedQuery of localStore.getAllQueries(api.files.getOwnedAll)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		const updatedFiles = cachedQuery.value.map((file) =>
			file._id === fileId
				? {
						...file,
						name: newName,
						updatedAt,
					}
				: file,
		);

		if (updatedFiles !== cachedQuery.value) {
			localStore.setQuery(
				api.files.getOwnedAll,
				cachedQuery.args,
				updatedFiles,
			);
		}
	}
}

export function optimisticUpdateFileContentCache(
	localStore: OptimisticLocalStore,
	fileId: Id<"files">,
	content: string,
	updatedAt: number,
) {
	const cachedFileById = localStore.getQuery(api.files.getOwnedById, {
		fileId,
	});

	if (cachedFileById !== undefined && cachedFileById.type === "file") {
		localStore.setQuery(
			api.files.getOwnedById,
			{ fileId },
			{
				...cachedFileById,
				content,
				updatedAt,
			},
		);
	}

	for (const cachedQuery of localStore.getAllQueries(api.files.getOwnedAll)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		let didUpdate = false;
		const updatedFiles = cachedQuery.value.map((file) =>
			file._id === fileId && file.type === "file"
				? {
						...file,
						content,
						updatedAt,
					}
				: file,
		);

		for (const file of cachedQuery.value) {
			if (file._id === fileId && file.type === "file") {
				didUpdate = true;
				break;
			}
		}

		if (didUpdate) {
			localStore.setQuery(
				api.files.getOwnedAll,
				cachedQuery.args,
				updatedFiles,
			);
		}
	}

	for (const cachedQuery of localStore.getAllQueries(
		api.files.getOwnedSorted,
	)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		let didUpdate = false;
		const updatedFiles = cachedQuery.value.map((file) =>
			file._id === fileId && file.type === "file"
				? {
						...file,
						content,
						updatedAt,
					}
				: file,
		);

		for (const file of cachedQuery.value) {
			if (file._id === fileId && file.type === "file") {
				didUpdate = true;
				break;
			}
		}

		if (didUpdate) {
			localStore.setQuery(
				api.files.getOwnedSorted,
				cachedQuery.args,
				updatedFiles,
			);
		}
	}
}

export function optimisticRemoveFileCache(
	localStore: OptimisticLocalStore,
	fileId: Id<"files">,
) {
	const filesByParentId = new Map<Id<"files"> | undefined, Doc<"files">[]>();

	for (const cachedQuery of localStore.getAllQueries(
		api.files.getOwnedSorted,
	)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		filesByParentId.set(cachedQuery.args.parentId, cachedQuery.value);
	}

	const deletedIds = new Set<Id<"files">>([fileId]);
	const queue: Id<"files">[] = [fileId];

	while (queue.length > 0) {
		const currentFileId = queue.shift();
		if (currentFileId === undefined) continue;

		const children = filesByParentId.get(currentFileId) ?? [];
		for (const child of children) {
			if (deletedIds.has(child._id)) continue;

			deletedIds.add(child._id);

			if (child.type === "folder") {
				queue.push(child._id);
			}
		}
	}

	for (const cachedQuery of localStore.getAllQueries(
		api.files.getOwnedSorted,
	)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		const updatedFiles = cachedQuery.value.filter(
			(file) => !deletedIds.has(file._id),
		);

		if (updatedFiles.length !== cachedQuery.value.length) {
			localStore.setQuery(
				api.files.getOwnedSorted,
				cachedQuery.args,
				updatedFiles,
			);
		}
	}

	for (const cachedQuery of localStore.getAllQueries(api.files.getOwnedAll)) {
		if (cachedQuery.value === undefined) {
			continue;
		}

		const updatedFiles = cachedQuery.value.filter(
			(file) => !deletedIds.has(file._id),
		);

		if (updatedFiles.length !== cachedQuery.value.length) {
			localStore.setQuery(
				api.files.getOwnedAll,
				cachedQuery.args,
				updatedFiles,
			);
		}
	}
}
