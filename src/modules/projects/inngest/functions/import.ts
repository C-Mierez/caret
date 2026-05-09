import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { sortGithubTree } from "@lib/github/github-utils";
import { getMachineConvexClient } from "@lib/server/convex";
import type { GetStepTools } from "inngest";
import ky from "ky";
import { Octokit } from "octokit";
import type { z } from "zod";
import { inngest } from "@/inngest/client";
import { GithubImportCancelledEvent, GithubImportEvent } from "../events";
import { createFilesFromTree } from "../lib/create-files-from-tree";
import { createFoldersFromTree } from "../lib/create-folders-from-tree";
import type { GithubTreeItem } from "../lib/github-tree-types";
import { updateProjectStatus } from "../lib/update-project-status";

type GitTreeResponse = {
	sha: string;
	url: string;
	tree: Array<{
		path: string;
		type?: string;
		sha?: string;
	}>;
	truncated?: boolean;
};

async function _executeCleanupSteps(
	step: GetStepTools<typeof inngest>,
	projectId: Id<"projects">,
) {
	const serviceToken = await step.run("mint-service-token", async () => {
		const { mintServiceToken } = await import("@lib/server/service-token");
		return await mintServiceToken("inngest-conversation-worker");
	});

	await step.run("cleanup-project-files", async () => {
		const convexClient = await getMachineConvexClient(serviceToken);

		await convexClient.mutation(
			api.system.files.removeAllFilesFromProject,
			{
				projectId: projectId,
			},
		);
	});

	await step.run("delete-project", async () => {
		const convexClient = await getMachineConvexClient(serviceToken);

		await convexClient.mutation(api.system.projects.deleteProject, {
			projectId: projectId,
		});
	});
}

export const githubImportCancelled = inngest.createFunction(
	{
		id: "github-import-cancelled",
		triggers: { event: GithubImportCancelledEvent },
	},
	async ({ event, step }) => {
		console.log("Processing GitHub import cancellation event", event.data);

		await updateProjectStatus({
			projectId: event.data.projectId,
			payload: {
				type: "import",
				status: "canceled",
			},
		});

		await _executeCleanupSteps(
			step,
			event.data.projectId as Id<"projects">,
		);

		return { success: true };
	},
);

export const githubImport = inngest.createFunction(
	{
		id: "github-import",
		triggers: { event: GithubImportEvent },
		cancelOn: [
			{
				event: GithubImportCancelledEvent,
				if: "event.data.projectId == async.data.projectId",
			},
		],
		onFailure: async ({ event, error, step }) => {
			console.error("GitHub import failed", {
				error,
				eventData: event.data,
			});

			const { projectId } = event.data.event.data as z.infer<
				typeof GithubImportEvent.schema
			>;

			if (!projectId) return;

			await updateProjectStatus({
				projectId: projectId,
				payload: {
					type: "import",
					status: "failed",
				},
			});

			await _executeCleanupSteps(step, projectId as Id<"projects">);
		},
	},
	async ({ event, step }) => {
		console.log("Processing GitHub import event", event.data);

		const { owner, repo, githubToken, projectId } = event.data;

		// Github client
		const octokit = new Octokit({
			auth: githubToken,
		});

		const serviceToken = await step.run("mint-service-token", async () => {
			const { mintServiceToken } = await import(
				"@lib/server/service-token"
			);
			return await mintServiceToken("inngest-conversation-worker");
		});

		// Clean up files in the project that may exist
		await step.run("cleanup-project-files", async () => {
			const convexClient = await getMachineConvexClient(serviceToken);

			await convexClient.mutation(
				api.system.files.removeAllFilesFromProject,
				{
					projectId: projectId as Id<"projects">,
				},
			);
		});

		// Get the repo tree
		const repoTree = await step.run("get-repo-tree", async () => {
			try {
				const { data } = await octokit.rest.git.getTree({
					owner,
					repo,
					tree_sha: "main", // This should be a user input actually
					recursive: "1",
				});

				return data;
			} catch (err) {
				console.error("Error fetching repo tree from GitHub", {
					error: err,
					owner,
					repo,
				});
			}
		});

		// Sort folders by depth. Parents must be created before children
		const sortedTree = sortGithubTree(
			(repoTree as GitTreeResponse | undefined)?.tree ?? [],
		) as GithubTreeItem[];

		// Create all folders first
		const folderPathIdsRecord = await step.run(
			"create-project-folders",
			async () => {
				const convexClient = await getMachineConvexClient(serviceToken);

				const pathIds = await createFoldersFromTree(sortedTree, {
					projectId: projectId as Id<"projects">,
					createFolderFn: async ({ name, parentId }) =>
						await convexClient.mutation(
							api.system.files.createFolder,
							{
								projectId: projectId as Id<"projects">,
								name,
								parentId: parentId as Id<"files"> | undefined,
							},
						),
				});

				// Convert Map to plain object for Inngest serialization
				return Object.fromEntries(pathIds);
			},
		);

		// Create all files with binary detection and storage handling
		await step.run("create-project-files", async () => {
			const convexClient = await getMachineConvexClient(serviceToken);

			// Convert object back to Map
			const folderPathIds = new Map(Object.entries(folderPathIdsRecord));

			await createFilesFromTree(sortedTree, {
				projectId: projectId as Id<"projects">,
				createTextFileFn: async ({ name, parentId, content }) =>
					await convexClient.mutation(api.system.files.createFile, {
						projectId: projectId as Id<"projects">,
						name,
						type: "file",
						content,
						parentId: parentId as Id<"files"> | undefined,
					}),
				createBinaryFileFn: async ({ name, parentId, storageId }) =>
					await convexClient.mutation(
						api.system.files.createBinaryFile,
						{
							projectId: projectId as Id<"projects">,
							name,
							storageId: storageId as Id<"_storage">,
							parentId: parentId as Id<"files"> | undefined,
						},
					),
				generateUploadUrlFn: async () => {
					const uploadUrl = await convexClient.mutation(
						api.system.files.generateUploadUrl,
						{},
					);
					return uploadUrl;
				},
				uploadToBlobFn: async (uploadUrl: string, buffer: Buffer) => {
					const response = await ky.post(uploadUrl, {
						headers: {
							"Content-Type": "application/octet-stream",
						},
						body: new Uint8Array(buffer),
					});

					if (!response.ok) {
						throw new Error(
							`Failed to upload blob: ${response.statusText}`,
						);
					}

					const data = (await response.json()) as {
						storageId: string;
					};
					return data.storageId;
				},
				pathToParentId: folderPathIds,
				getBlobFn: async (sha: string) => {
					try {
						const { data } = await octokit.rest.git.getBlob({
							owner,
							repo,
							file_sha: sha,
						});
						return {
							sha: data.sha,
							size: data.size || 0,
							content: data.content,
							encoding: data.encoding,
						};
					} catch (err) {
						console.error("Error fetching blob from GitHub", {
							error: err,
							sha,
						});
						return null;
					}
				},
			});
		});

		await step.run("finalize-import", async () => {
			await updateProjectStatus({
				projectId: projectId,
				payload: {
					type: "import",
					status: "completed",
				},
			});
		});

		return { success: true, projectId };
	},
);
