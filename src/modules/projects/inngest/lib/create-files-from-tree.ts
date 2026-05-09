import { isBinaryFile } from "isbinaryfile";
import type { GithubFileBlob, GithubTreeItem } from "./github-tree-types";

type CreateTextFileInput = {
	projectId: string;
	parentId?: string;
	name: string;
	content: string;
};

type CreateBinaryFileInput = {
	projectId: string;
	parentId?: string;
	name: string;
	storageId: string;
};

type FileCreationOptions = {
	projectId: string;
	createTextFileFn: (input: CreateTextFileInput) => Promise<string>;
	createBinaryFileFn: (input: CreateBinaryFileInput) => Promise<string>;
	generateUploadUrlFn: () => Promise<string>;
	uploadToBlobFn: (uploadUrl: string, buffer: Buffer) => Promise<string>;
	pathToParentId: Map<string, string>;
};

export async function createFilesFromTree(
	entries: GithubTreeItem[],
	options: FileCreationOptions & {
		getBlobFn: (sha: string) => Promise<GithubFileBlob | null>;
	},
): Promise<Map<string, string>> {
	const createdPathIds = new Map<string, string>();

	const fileEntries = entries.filter(
		(entry) => entry.type === "blob" && entry.path && entry.sha,
	);

	if (fileEntries.length === 0) return createdPathIds;

	const blobsData = await Promise.all(
		fileEntries.map(async (entry) => {
			const blob = await options.getBlobFn(entry.sha || "");
			return { entry, blob };
		}),
	);

	const filesWithDetection = await Promise.all(
		blobsData.map(async ({ entry, blob }) => {
			if (!blob) return null;
			const isBinary = await detectBinaryContent(blob);
			return { entry, blob, isBinary };
		}),
	);

	const validFiles = filesWithDetection.filter((f) => f !== null) as Array<{
		entry: GithubTreeItem;
		blob: GithubFileBlob;
		isBinary: boolean;
	}>;

	const textFiles = validFiles.filter((f) => !f.isBinary);
	const binaryFiles = validFiles.filter((f) => f.isBinary);

	const textFilePromises = textFiles.map(async ({ entry, blob }) => {
		const pathParts = entry.path.split("/");
		const name = pathParts.pop() ?? "";
		const parentPath = pathParts.join("/");
		const parentId = options.pathToParentId.get(parentPath);

		const content =
			blob.encoding === "base64"
				? Buffer.from(blob.content, "base64").toString("utf-8")
				: blob.content;

		const fileId = await options.createTextFileFn({
			projectId: options.projectId,
			parentId,
			name,
			content,
		});

		createdPathIds.set(entry.path, fileId);
	});

	const binaryFilePromises = binaryFiles.map(async ({ entry, blob }) => {
		const pathParts = entry.path.split("/");
		const name = pathParts.pop() ?? "";
		const parentPath = pathParts.join("/");
		const parentId = options.pathToParentId.get(parentPath);

		try {
			const uploadUrl = await options.generateUploadUrlFn();

			const buffer =
				blob.encoding === "base64"
					? Buffer.from(blob.content, "base64")
					: Buffer.from(blob.content, "utf-8");

			const storageId = await options.uploadToBlobFn(uploadUrl, buffer);

			const fileId = await options.createBinaryFileFn({
				projectId: options.projectId,
				parentId,
				name,
				storageId,
			});

			createdPathIds.set(entry.path, fileId);
		} catch (err) {
			console.error("Error creating binary file:", {
				error: err,
				path: entry.path,
			});
		}
	});

	await Promise.all([...textFilePromises, ...binaryFilePromises]);

	return createdPathIds;
}

async function detectBinaryContent(blob: GithubFileBlob): Promise<boolean> {
	try {
		if (blob.encoding === "base64") {
			const buffer = Buffer.from(blob.content, "base64");
			return await isBinaryFile(buffer, { size: buffer.length });
		}
		const buffer = Buffer.from(blob.content, "utf-8");
		return await isBinaryFile(buffer, { size: buffer.length });
	} catch (error) {
		console.error("Error detecting binary content:", error);
		return false;
	}
}
