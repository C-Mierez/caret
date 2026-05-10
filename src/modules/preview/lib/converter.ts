import type { Doc, Id } from "@convex/_generated/dataModel";
import type { FileSystemTree } from "@webcontainer/api";

export type ProjectFile = Doc<"files">;

type ProjectFileMap = Map<Id<"files">, ProjectFile>;

function normalizeFileMap(
	files: ProjectFile[] | ProjectFileMap,
): ProjectFileMap {
	if (files instanceof Map) {
		return files;
	}

	return new Map(files.map((file) => [file._id, file]));
}

function getSortedChildren(
	files: ProjectFileMap,
	parentId: Id<"files"> | undefined,
) {
	return [...files.values()]
		.filter((file) => file.parentId === parentId)
		.sort((a, b) => {
			if (a.type === "folder" && b.type === "file") return -1;
			if (a.type === "file" && b.type === "folder") return 1;

			return a.name.localeCompare(b.name);
		});
}

function buildTreeNode(
	file: ProjectFile,
	files: ProjectFileMap,
): FileSystemTree[string] {
	if (file.type === "file") {
		// Treat files that point to external storage (binary) as empty files
		// so we can build the file tree without fetching their contents.
		return {
			file: {
				contents: file.content ?? "",
			},
		};
	}

	const directory: Record<string, FileSystemTree[string]> = {};

	for (const child of getSortedChildren(files, file._id)) {
		directory[child.name] = buildTreeNode(child, files);
	}

	return {
		directory,
	};
}

export function buildFileTreeFromProject(
	files: ProjectFile[] | ProjectFileMap,
): FileSystemTree {
	const fileMap = normalizeFileMap(files);
	const tree: FileSystemTree = {};

	for (const file of getSortedChildren(fileMap, undefined)) {
		tree[file.name] = buildTreeNode(file, fileMap);
	}

	return tree;
}

export function getFilePath(
	file: ProjectFile,
	files: ProjectFile[] | ProjectFileMap,
): string {
	const fileMap = normalizeFileMap(files);
	const pathSegments = [file.name];
	let parentId = file.parentId;

	while (parentId) {
		const parent = fileMap.get(parentId);

		if (!parent) {
			break;
		}

		pathSegments.unshift(parent.name);
		parentId = parent.parentId;
	}

	return `/${pathSegments.join("/")}`;
}
