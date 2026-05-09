import type { Doc } from "@convex/_generated/dataModel";
import { isBinaryFile } from "isbinaryfile";
import ky from "ky";
import type { Octokit } from "octokit";

type FileWithUrl = Doc<"files"> & {
	storageUrl: string | null;
};

type CreateBlobsFromFilesOptions = {
	octokit: Octokit;
	owner: string;
	repo: string;
};

/**
 * Builds a map of file IDs to their full paths in the project hierarchy
 */
function buildPathMap(files: FileWithUrl[]): Map<string, string> {
	const pathMap = new Map<string, string>();

	// First pass: build ID to parent ID mapping
	const idToParentId = new Map<string, string | undefined>();
	const idToName = new Map<string, string>();

	for (const file of files) {
		idToName.set(file._id, file.name);
		idToParentId.set(file._id, file.parentId);
	}

	// Second pass: build full paths
	for (const file of files) {
		const path: string[] = [];
		let currentId: string | undefined = file._id;

		while (currentId) {
			const name = idToName.get(currentId);
			if (name) {
				path.unshift(name);
			}
			currentId = idToParentId.get(currentId);
		}

		pathMap.set(file._id, path.join("/"));
	}

	return pathMap;
}

/**
 * Detects if a blob content is binary
 */
async function detectBinaryContent(buffer: Buffer): Promise<boolean> {
	try {
		return await isBinaryFile(buffer, { size: buffer.length });
	} catch (error) {
		console.error("Error detecting binary content:", error);
		return false;
	}
}

/**
 * Fetches binary file content from a storage URL
 */
async function fetchBinaryContent(storageUrl: string): Promise<Buffer | null> {
	try {
		const response = await ky.get(storageUrl);
		const arrayBuffer = await response.arrayBuffer();
		return Buffer.from(arrayBuffer);
	} catch (error) {
		console.error("Error fetching binary content from storage:", error);
		return null;
	}
}

/**
 * Creates GitHub blobs from Caret files
 * Transforms the Caret file schema into GitHub blobs
 * Handles both text and binary files appropriately
 *
 * @param files - Array of files from Convex with storage URLs
 * @param options - Configuration including Octokit client and repo info
 * @returns Map of file paths to blob SHAs
 */
export async function createBlobsFromFiles(
	files: FileWithUrl[],
	options: CreateBlobsFromFilesOptions,
): Promise<Map<string, string>> {
	const pathMap = buildPathMap(files);

	// Filter out folders, keep only files
	const fileEntries = files.filter((file) => file.type === "file");

	if (fileEntries.length === 0) {
		return new Map();
	}

	const blobsData = await Promise.all(
		fileEntries.map(async (file) => {
			const filePath = pathMap.get(file._id);
			if (!filePath) {
				console.warn(`Unable to determine path for file ${file._id}`);
				return null;
			}

			let buffer: Buffer | null = null;

			// Handle text files
			if (file.content !== undefined) {
				buffer = Buffer.from(file.content, "utf-8");
			}
			// Handle binary files
			else if (file.storageUrl) {
				buffer = await fetchBinaryContent(file.storageUrl);
			}

			if (!buffer) {
				console.warn(`Unable to fetch content for file ${filePath}`);
				return null;
			}

			return { file, filePath, buffer };
		}),
	);

	const validFiles = blobsData.filter((f) => f !== null) as Array<{
		file: FileWithUrl;
		filePath: string;
		buffer: Buffer;
	}>;

	// Detect binary content for each file
	const filesWithDetection = await Promise.all(
		validFiles.map(async ({ file, filePath, buffer }) => {
			const isBinary = await detectBinaryContent(buffer);
			return { file, filePath, buffer, isBinary };
		}),
	);

	// Create blobs concurrently
	const blobShaMap = new Map<string, string>();

	const blobCreationPromises = filesWithDetection.map(
		async ({ filePath, buffer }) => {
			try {
				const { data: blob } =
					await options.octokit.rest.git.createBlob({
						owner: options.owner,
						repo: options.repo,
						content: buffer.toString("base64"),
						encoding: "base64",
					});

				blobShaMap.set(filePath, blob.sha);
			} catch (error) {
				console.error(
					`Error creating blob for file ${filePath}:`,
					error,
				);
			}
		},
	);

	await Promise.all(blobCreationPromises);

	return blobShaMap;
}
