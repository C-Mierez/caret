import type { GithubTreeItem } from "./github-tree-types";

type CreateFolderInput = {
	projectId: string;
	parentId?: string;
	name: string;
};

type FolderCreationOptions = {
	projectId: string;
	createFolderFn: (input: CreateFolderInput) => Promise<string>;
};

export async function createFoldersFromTree(
	entries: GithubTreeItem[],
	options: FolderCreationOptions,
): Promise<Map<string, string>> {
	const createdPathIds = new Map<string, string>();

	const folderEntries = entries.filter((entry) => entry.type === "tree");

	for (const entry of folderEntries) {
		if (!entry.path) continue;

		const pathParts = entry.path.split("/");
		const name = pathParts.pop();

		if (!name) continue;

		const parentPath = pathParts.join("/");
		const parentId = parentPath
			? createdPathIds.get(parentPath)
			: undefined;

		const folderId = await options.createFolderFn({
			projectId: options.projectId,
			parentId,
			name,
		});

		createdPathIds.set(entry.path, folderId);
	}

	return createdPathIds;
}
