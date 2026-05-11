import { describe, expect, it } from "bun:test";
import { createFoldersFromTree } from "../create-folders-from-tree";

describe("createFoldersFromTree", () => {
	it("creates only folders in parent-first order", async () => {
		const calls: Array<{
			name: string;
			parentId?: string;
		}> = [];

		const pathIds = await createFoldersFromTree(
			[
				{ path: "src", type: "tree" },
				{ path: "src/utils", type: "tree" },
				{ path: "src/utils/helpers.ts", type: "blob" },
				{ path: "src/components", type: "tree" },
				{ path: "dist", type: "tree" },
			],
			{
				projectId: "project-1",
				createFolderFn: async ({ name, parentId }) => {
					calls.push({ name, parentId });
					return `folder:${name}`;
				},
			},
		);

		expect(calls).toEqual([
			{ name: "src", parentId: undefined },
			{ name: "utils", parentId: "folder:src" },
			{ name: "components", parentId: "folder:src" },
			{ name: "dist", parentId: undefined },
		]);

		expect(pathIds.get("src")).toBe("folder:src");
		expect(pathIds.get("src/utils")).toBe("folder:utils");
	});
});
