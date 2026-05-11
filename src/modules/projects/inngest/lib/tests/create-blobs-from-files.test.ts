import { beforeEach, describe, expect, it, vi } from "bun:test";
import type { Doc, Id } from "@convex/_generated/dataModel";
import type { Octokit } from "octokit";
import { createBlobsFromFiles } from "../create-blobs-from-files";

type FileWithUrl = Doc<"files"> & {
	storageUrl: string | null;
};

// Mock Octokit
const createMockOctokit = () => {
	return {
		rest: {
			git: {
				createBlob: vi.fn().mockResolvedValue({
					data: { sha: "abc123def456" },
				}),
			},
		},
	} as unknown as Octokit;
};

// Helper to create mock files
const createMockFile = (overrides?: Partial<FileWithUrl>): FileWithUrl => ({
	_id: "test-id" as Id<"files">,
	_creationTime: Date.now(),
	projectId: "project-1" as Id<"projects">,
	parentId: undefined,
	name: "test.txt",
	type: "file",
	content: "test content",
	storageId: undefined,
	storageUrl: null,
	updatedAt: Date.now(),
	...overrides,
});

const createMockFolder = (overrides?: Partial<FileWithUrl>): FileWithUrl => ({
	_id: "folder-id" as Id<"files">,
	_creationTime: Date.now(),
	projectId: "project-1" as Id<"projects">,
	parentId: undefined,
	name: "folder",
	type: "folder",
	content: undefined,
	storageId: undefined,
	storageUrl: null,
	updatedAt: Date.now(),
	...overrides,
});

describe("createBlobsFromFiles", () => {
	let mockOctokit: Octokit;

	beforeEach(() => {
		mockOctokit = createMockOctokit();
	});

	it("should create blobs for text files", async () => {
		const files: FileWithUrl[] = [
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "README.md",
				content: "# Hello World",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(1);
		expect(result.get("README.md")).toBe("abc123def456");
		expect(mockOctokit.rest.git.createBlob).toHaveBeenCalledTimes(1);
	});

	it("should filter out folders", async () => {
		const files: FileWithUrl[] = [
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "file.txt",
				content: "content",
			}),
			createMockFolder({
				_id: "folder-1" as Id<"files">,
				name: "src",
			}),
			createMockFile({
				_id: "file-2" as Id<"files">,
				name: "file2.txt",
				content: "content2",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		// Should only have 2 blobs (folders excluded)
		expect(result.size).toBe(2);
		expect(mockOctokit.rest.git.createBlob).toHaveBeenCalledTimes(2);
	});

	it("should build correct paths for nested files", async () => {
		const files: FileWithUrl[] = [
			createMockFolder({
				_id: "folder-1" as Id<"files">,
				name: "src",
			}),
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "index.ts",
				parentId: "folder-1" as Id<"files">,
				content: "export default {}",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(1);
		expect(result.get("src/index.ts")).toBe("abc123def456");
	});

	it("should handle deeply nested files", async () => {
		const files: FileWithUrl[] = [
			createMockFolder({
				_id: "folder-1" as Id<"files">,
				name: "src",
			}),
			createMockFolder({
				_id: "folder-2" as Id<"files">,
				name: "components",
				parentId: "folder-1" as Id<"files">,
			}),
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "Button.tsx",
				parentId: "folder-2" as Id<"files">,
				content: "export function Button() {}",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(1);
		expect(result.get("src/components/Button.tsx")).toBe("abc123def456");
	});

	it("should handle binary files (with storage URL)", async () => {
		// Mock the ky fetch for binary files
		const binaryBuffer = Buffer.from([
			0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
		]); // PNG header

		global.fetch = vi
			.fn()
			.mockResolvedValue(
				new Response(binaryBuffer, { status: 200 }),
			) as unknown as typeof fetch;

		const files: FileWithUrl[] = [
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "image.png",
				content: undefined, // Binary files don't have content
				storageUrl: "https://storage.example.com/image.png",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(1);
		expect(result.get("image.png")).toBe("abc123def456");
	});

	it("should handle empty file list", async () => {
		const result = await createBlobsFromFiles([], {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(0);
		expect(mockOctokit.rest.git.createBlob).not.toHaveBeenCalled();
	});

	it("should handle only folders", async () => {
		const files: FileWithUrl[] = [
			createMockFolder({
				_id: "folder-1" as Id<"files">,
				name: "src",
			}),
			createMockFolder({
				_id: "folder-2" as Id<"files">,
				name: "tests",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(0);
		expect(mockOctokit.rest.git.createBlob).not.toHaveBeenCalled();
	});

	it("should handle mixed content files", async () => {
		const files: FileWithUrl[] = [
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "text.txt",
				content: "Hello, World!",
			}),
			createMockFile({
				_id: "file-2" as Id<"files">,
				name: "code.json",
				content: '{"key": "value"}',
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(2);
		expect(result.get("text.txt")).toBe("abc123def456");
		expect(result.get("code.json")).toBe("abc123def456");
	});

	it("should encode content as base64 for blobs", async () => {
		const files: FileWithUrl[] = [
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "test.txt",
				content: "Hello, World!",
			}),
		];

		await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		// Verify that createBlob was called with base64 encoded content
		const createBlobMock = mockOctokit.rest.git.createBlob as unknown as {
			mock: {
				calls: Array<
					[
						{
							content: string;
							encoding: string;
						},
					]
				>;
			};
		};

		const callArgs = createBlobMock.mock.calls[0][0];

		expect(callArgs.content).toBe(
			Buffer.from("Hello, World!", "utf-8").toString("base64"),
		);
		expect(callArgs.encoding).toBe("base64");
	});

	it("should handle files with special characters in paths", async () => {
		const files: FileWithUrl[] = [
			createMockFile({
				_id: "file-1" as Id<"files">,
				name: "file with spaces.txt",
				content: "content",
			}),
			createMockFile({
				_id: "file-2" as Id<"files">,
				name: "file-with-dashes.js",
				content: "console.log('test')",
			}),
		];

		const result = await createBlobsFromFiles(files, {
			octokit: mockOctokit,
			owner: "testuser",
			repo: "testrepo",
		});

		expect(result.size).toBe(2);
		expect(result.get("file with spaces.txt")).toBe("abc123def456");
		expect(result.get("file-with-dashes.js")).toBe("abc123def456");
	});
});
