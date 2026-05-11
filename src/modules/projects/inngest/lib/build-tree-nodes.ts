import type { Doc } from "@convex/_generated/dataModel";

type FileWithUrl = Doc<"files"> & {
	storageUrl: string | null;
};

type TreeNode = {
	path: string;
	mode: "100644";
	type: "blob";
	sha: string;
};

/**
 * Builds a tree structure map for creating a GitHub tree
 * Maps each file/folder path to its tree node representation
 *
 * @param files - Array of files from Convex
 * @param blobShaMap - Map of file paths to their blob SHAs from createBlobsFromFiles
 * @returns Array of tree nodes suitable for octokit.rest.git.createTree
 */
export function buildTreeNodes(
	files: FileWithUrl[],
	blobShaMap: Map<string, string>,
): TreeNode[] {
	const treeNodes: TreeNode[] = [];

	// Build a map of path to file for quick lookups
	const idToName = new Map<string, string>();
	const idToParentId = new Map<string, string | undefined>();

	for (const file of files) {
		idToName.set(file._id, file.name);
		idToParentId.set(file._id, file.parentId);
	}

	// Helper function to get the full path for a file ID
	const getPath = (fileId: string): string => {
		const path: string[] = [];
		let currentId: string | undefined = fileId;

		while (currentId) {
			const name = idToName.get(currentId);
			if (name) {
				path.unshift(name);
			}
			currentId = idToParentId.get(currentId);
		}

		return path.join("/");
	};

	// Process only file entries. Folder entries are derived from blob paths by GitHub.
	for (const file of files) {
		if (file.type !== "file") {
			continue;
		}

		const filePath = getPath(file._id);

		const blobSha = blobShaMap.get(filePath);
		if (blobSha) {
			treeNodes.push({
				path: filePath,
				mode: "100644",
				type: "blob",
				sha: blobSha,
			});
		} else {
			console.warn(`Blob SHA not found for file ${filePath}. Skipping.`);
		}
	}

	return treeNodes;
}
