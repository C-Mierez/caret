import { describe, expect, it } from "bun:test";
import { createFilesFromTree } from "../create-files-from-tree";
import type { GithubFileBlob } from "../github-tree-types";

describe("createFilesFromTree", () => {
	it("creates text files directly and binary files with storage upload", async () => {
		const textFileCalls: Array<{
			name: string;
			parentId?: string;
			content: string;
		}> = [];
		const binaryFileCalls: Array<{
			name: string;
			parentId?: string;
			storageId: string;
		}> = [];
		const uploadCalls: Array<{
			uploadUrl: string;
			bufferLength: number;
		}> = [];

		const mockBlobs: Record<string, GithubFileBlob> = {
			"sha-text": {
				sha: "sha-text",
				size: 20,
				content: "console.log('hello')",
				encoding: "utf-8",
			},
			"sha-base64-text": {
				sha: "sha-base64-text",
				size: 20,
				content: Buffer.from("console.log('test')").toString("base64"),
				encoding: "base64",
			},
			"sha-binary": {
				sha: "sha-binary",
				size: 200,
				content: Buffer.from(
					"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR",
				).toString("base64"),
				encoding: "base64",
			},
		};

		const pathIds = await createFilesFromTree(
			[
				{ path: "src", type: "tree" },
				{ path: "src/index.ts", type: "blob", sha: "sha-text" },
				{
					path: "src/utils/helpers.ts",
					type: "blob",
					sha: "sha-base64-text",
				},
				{ path: "src/image.png", type: "blob", sha: "sha-binary" },
				{ path: "", type: "blob", sha: "sha-text" },
			],
			{
				projectId: "project-1",
				createTextFileFn: async ({ name, parentId, content }) => {
					textFileCalls.push({ name, parentId, content });
					return `file:${name}`;
				},
				createBinaryFileFn: async ({ name, parentId, storageId }) => {
					binaryFileCalls.push({ name, parentId, storageId });
					return `file:${name}`;
				},
				generateUploadUrlFn: async () => {
					return "https://storage.example.com/upload?token=abc123";
				},
				uploadToBlobFn: async (uploadUrl: string, buffer: Buffer) => {
					uploadCalls.push({
						uploadUrl,
						bufferLength: buffer.length,
					});
					return `storage-id-${uploadCalls.length}`;
				},
				pathToParentId: new Map([
					["src", "folder:src"],
					["src/utils", "folder:utils"],
				]),
				getBlobFn: async (sha: string) => mockBlobs[sha] || null,
			},
		);

		expect(textFileCalls.length).toBe(2);
		expect(binaryFileCalls.length).toBe(1);
		expect(uploadCalls.length).toBe(1);

		expect(textFileCalls[0]).toEqual({
			name: "index.ts",
			parentId: "folder:src",
			content: "console.log('hello')",
		});

		expect(textFileCalls[1]).toEqual({
			name: "helpers.ts",
			parentId: "folder:utils",
			content: "console.log('test')",
		});

		expect(binaryFileCalls[0]).toEqual({
			name: "image.png",
			parentId: "folder:src",
			storageId: "storage-id-1",
		});

		expect(uploadCalls[0].bufferLength).toBe(17);

		expect(pathIds.get("src/index.ts")).toBe("file:index.ts");
		expect(pathIds.get("src/utils/helpers.ts")).toBe("file:helpers.ts");
		expect(pathIds.get("src/image.png")).toBe("file:image.png");
	});

	it("handles binary file upload errors gracefully", async () => {
		const textFileCalls: Array<{ name: string }> = [];
		const binaryErrorCalls: Array<{ name: string }> = [];

		const mockBlobs: Record<string, GithubFileBlob> = {
			"sha-binary": {
				sha: "sha-binary",
				size: 100,
				content: Buffer.from("\x89PNG\r\n\x1a").toString("base64"),
				encoding: "base64",
			},
		};

		const pathIds = await createFilesFromTree(
			[{ path: "src/image.png", type: "blob", sha: "sha-binary" }],
			{
				projectId: "project-1",
				createTextFileFn: async ({ name }) => {
					textFileCalls.push({ name });
					return `file:${name}`;
				},
				createBinaryFileFn: async ({ name }) => {
					binaryErrorCalls.push({ name });
					return `file:${name}`;
				},
				generateUploadUrlFn: async () => {
					throw new Error("Upload URL generation failed");
				},
				uploadToBlobFn: async () => {
					throw new Error("Upload failed");
				},
				pathToParentId: new Map([["src", "folder:src"]]),
				getBlobFn: async (sha: string) => mockBlobs[sha] || null,
			},
		);

		expect(textFileCalls.length).toBe(0);
		expect(binaryErrorCalls.length).toBe(0);
		expect(pathIds.size).toBe(0);
	});
});
