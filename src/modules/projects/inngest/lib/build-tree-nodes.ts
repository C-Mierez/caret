import type { Doc } from "@convex/_generated/dataModel";

type FileWithUrl = Doc<"files"> & {
	storageUrl: string | null;
};

type TreeNode = {
	path: string;
	mode: string; // "100644" for files, "100755" for executable, "040000" for directories
	type: "blob" | "tree";
	sha?: string;
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
	const processedPaths = new Set<string>();

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

	// Process all files and folders
	for (const file of files) {
		const filePath = getPath(file._id);

		if (file.type === "folder") {
			// Add folder node if not already added
			if (!processedPaths.has(filePath)) {
				treeNodes.push({
					path: filePath,
					mode: "040000",
					type: "tree",
				});
				processedPaths.add(filePath);
			}
		} else if (file.type === "file") {
			// Add file node with blob SHA
			const blobSha = blobShaMap.get(filePath);
			if (blobSha) {
				treeNodes.push({
					path: filePath,
					mode: "100644",
					type: "blob",
					sha: blobSha,
				});
				processedPaths.add(filePath);
			} else {
				console.warn(
					`Blob SHA not found for file ${filePath}. Skipping.`,
				);
			}
		}
	}

	return treeNodes;
}
