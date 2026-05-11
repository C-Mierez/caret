/// <reference types="bun-types" />

import { describe, expect, test } from "bun:test";

import {
	buildFileTreeFromProject,
	getFilePath,
	type ProjectFile,
} from "./converter";

function makeFile(
	overrides: Partial<ProjectFile> & { _id: ProjectFile["_id"] },
): ProjectFile {
	return {
		_id: overrides._id,
		_creationTime: overrides._creationTime ?? 0,
		name: overrides.name ?? "file.txt",
		parentId: overrides.parentId,
		projectId:
			overrides.projectId ?? ("project" as ProjectFile["projectId"]),
		type: overrides.type ?? "file",
		content: overrides.content,
		storageId: overrides.storageId,
		updatedAt: overrides.updatedAt ?? 0,
	};
}

describe("buildFileTreeFromProject", () => {
	test("returns an empty tree for no files", () => {
		expect(buildFileTreeFromProject([])).toEqual({});
	});

	test("builds a nested WebContainers tree with sorted siblings", () => {
		const rootFolder = makeFile({
			_id: "folder-root" as ProjectFile["_id"],
			name: "src",
			type: "folder",
		});
		const rootReadme = makeFile({
			_id: "file-readme" as ProjectFile["_id"],
			name: "README.md",
			content: "root",
		});
		const rootPackage = makeFile({
			_id: "file-package" as ProjectFile["_id"],
			name: "package.json",
			content: "{}",
		});
		const srcIndex = makeFile({
			_id: "file-index" as ProjectFile["_id"],
			name: "index.ts",
			parentId: rootFolder._id,
			content: "console.log('index')",
		});
		const srcAssets = makeFile({
			_id: "folder-assets" as ProjectFile["_id"],
			name: "assets",
			parentId: rootFolder._id,
			type: "folder",
		});
		const srcLogo = makeFile({
			_id: "file-logo" as ProjectFile["_id"],
			name: "logo.svg",
			parentId: srcAssets._id,
			content: "<svg />",
		});
		const srcConfig = makeFile({
			_id: "file-config" as ProjectFile["_id"],
			name: "app.config.ts",
			parentId: rootFolder._id,
			content: "export default {}",
		});

		const tree = buildFileTreeFromProject([
			rootReadme,
			rootFolder,
			srcIndex,
			srcAssets,
			rootPackage,
			srcLogo,
			srcConfig,
		]);

		expect(tree).toEqual({
			src: {
				directory: {
					assets: {
						directory: {
							"logo.svg": {
								file: {
									contents: "<svg />",
								},
							},
						},
					},
					"app.config.ts": {
						file: {
							contents: "export default {}",
						},
					},
					"index.ts": {
						file: {
							contents: "console.log('index')",
						},
					},
				},
			},
			"README.md": {
				file: {
					contents: "root",
				},
			},
			"package.json": {
				file: {
					contents: "{}",
				},
			},
		});
	});

	test("treats missing file content as an empty file", () => {
		const tree = buildFileTreeFromProject([
			makeFile({
				_id: "file-empty" as ProjectFile["_id"],
				name: "empty.txt",
			}),
		]);

		expect(tree).toEqual({
			"empty.txt": {
				file: {
					contents: "",
				},
			},
		});
	});

	test("accepts a Map input without changing the result", () => {
		const file = makeFile({
			_id: "file-map" as ProjectFile["_id"],
			name: "map.txt",
			content: "from map",
		});

		const tree = buildFileTreeFromProject(new Map([[file._id, file]]));

		expect(tree).toEqual({
			"map.txt": {
				file: {
					contents: "from map",
				},
			},
		});
	});

	test("treats binary files that point at storage as empty files", () => {
		const binaryFile = makeFile({
			_id: "file-binary" as ProjectFile["_id"],
			name: "image.png",
			storageId: "storage-id" as ProjectFile["storageId"],
		});

		const tree = buildFileTreeFromProject([binaryFile]);

		expect(tree).toEqual({
			"image.png": {
				file: {
					contents: "",
				},
			},
		});
	});
});

describe("getFilePath", () => {
	test("returns absolute paths for nested files", () => {
		const root = makeFile({
			_id: "root" as ProjectFile["_id"],
			name: "src",
			type: "folder",
		});
		const nestedFolder = makeFile({
			_id: "folder" as ProjectFile["_id"],
			name: "components",
			parentId: root._id,
			type: "folder",
		});
		const file = makeFile({
			_id: "file" as ProjectFile["_id"],
			name: "button.tsx",
			parentId: nestedFolder._id,
		});

		expect(getFilePath(file, [root, nestedFolder, file])).toBe(
			"/src/components/button.tsx",
		);
	});

	test("returns a root-level file path with only the filename", () => {
		const file = makeFile({
			_id: "file-root" as ProjectFile["_id"],
			name: "package.json",
		});

		expect(getFilePath(file, [file])).toBe("/package.json");
	});

	test("stops at missing parents instead of looping forever", () => {
		const orphan = makeFile({
			_id: "orphan" as ProjectFile["_id"],
			name: "lonely.txt",
			parentId: "missing-parent" as ProjectFile["parentId"],
		});

		expect(getFilePath(orphan, [orphan])).toBe("/lonely.txt");
	});
});
