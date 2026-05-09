import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { getMachineConvexClient } from "@lib/server/convex";
import type { GetStepTools } from "inngest";
import { Octokit } from "octokit";
import type { z } from "zod";
import { inngest } from "@/inngest/client";
import { GithubExportCancelledEvent, GithubExportEvent } from "../events";
import { buildTreeNodes } from "../lib/build-tree-nodes";
import { createBlobsFromFiles } from "../lib/create-blobs-from-files";
import { updateProjectStatus } from "../lib/update-project-status";

type FileWithUrl = Doc<"files"> & {
	storageUrl: string | null;
};

async function _executeCleanupSteps(
	step: GetStepTools<typeof inngest>,
	projectId: Id<"projects">,
) {
	try {
		const serviceToken = await step.run("mint-service-token", async () => {
			const { mintServiceToken } = await import(
				"@lib/server/service-token"
			);
			return await mintServiceToken("inngest-conversation-worker");
		});

		await step.run("cleanup-export-state", async () => {
			const convexClient = await getMachineConvexClient(serviceToken);

			// Try to fetch project to inspect exportRepoUrl
			let project: Doc<"projects"> | null = null;
			try {
				project = await convexClient.query(
					api.system.projects.getProject,
					{
						projectId,
					},
				);
			} catch (err) {
				console.warn("Unable to fetch project during cleanup:", err);
			}

			// Clear the export repo URL and mark canceled
			try {
				await convexClient.mutation(
					api.system.projects.updateExportStatus,
					{
						projectId: projectId,
						exportStatus: "canceled",
						exportRepoUrl: undefined,
					},
				);
			} catch (err) {
				console.error(
					"Failed to clear export status during cleanup:",
					err,
				);
			}

			if (project?.exportRepoUrl) {
				// We don't have a GitHub token here to delete the remote repo reliably.
				// Log the url so the operator can manually remove it if desired.
				console.log(
					"Export cleanup: remote repository exists but cannot be automatically deleted:",
					project.exportRepoUrl,
				);
			}
		});
	} catch (err) {
		console.error("Error executing cleanup steps:", err);
	}
}

export const githubExportCancelled = inngest.createFunction(
	{
		id: "github-export-cancelled",
		triggers: { event: GithubExportCancelledEvent },
	},
	async ({ event, step }) => {
		console.log("Processing GitHub export cancellation event", event.data);

		await updateProjectStatus({
			projectId: event.data.projectId,
			payload: {
				type: "export",
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

export const githubExport = inngest.createFunction(
	{
		id: "github-export",
		triggers: { event: GithubExportEvent },
		cancelOn: [
			{
				event: GithubExportCancelledEvent,
				if: "event.data.projectId == async.data.projectId",
			},
		],
		onFailure: async ({ event, error, step }) => {
			console.error("GitHub export failed", {
				error,
				eventData: event.data,
			});

			const { projectId } = event.data.event.data as z.infer<
				typeof GithubExportEvent.schema
			>;

			if (!projectId) return;

			await updateProjectStatus({
				projectId: projectId,
				payload: {
					type: "export",
					status: "failed",
				},
			});

			await _executeCleanupSteps(step, projectId as Id<"projects">);
		},
	},
	async ({ event, step }) => {
		console.log("Processing GitHub export event", event.data);

		const { githubToken, owner, projectId, repo: repoName } = event.data;

		await updateProjectStatus({
			projectId: projectId,
			payload: {
				type: "export",
				status: "exporting",
			},
		});

		const octokit = new Octokit({
			auth: githubToken,
		});

		// Get the authenticated user from the github token
		const { data: user } = (await step.run("get-github-user", async () => {
			return await octokit.rest.users.getAuthenticated();
		})) as Awaited<ReturnType<typeof octokit.rest.users.getAuthenticated>>;

		// Create a new repo
		const { data: repo } = (await step.run(
			"create-github-repo",
			async () => {
				return await octokit.rest.repos.createForAuthenticatedUser({
					name: repoName,
					description: `Exported from Caret`,
					private: true,
					auto_init: true,
				});
			},
		)) as Awaited<
			ReturnType<typeof octokit.rest.repos.createForAuthenticatedUser>
		>;

		// Record the repo URL on the project so cleanup handlers can access it
		await step.run("record-repo-url", async () => {
			await updateProjectStatus({
				projectId: projectId,
				payload: {
					type: "export",
					status: "exporting",
					repoUrl: repo.html_url,
				},
			});
		});

		await step.run("poll-until-committed", async () => {
			// Poll the repo until the default branch has a commit

			await octokit.rest.repos.listCommits({
				owner,
				repo: repoName,
				per_page: 1,
			});

			// If the above call doesn't throw, it means the repo has at least one commit
		});

		// Get the initial commit
		const { commitSha } = (await step.run(
			"get-initial-commit",
			async () => {
				const ref = await octokit.rest.git.getRef({
					owner: user.login,
					repo: repoName,
					ref: "heads/main",
				});

				return { commitSha: ref.data.object?.sha ?? null };
			},
		)) as { commitSha: string | null };

		if (!commitSha) {
			throw new Error("Unable to determine initial commit SHA");
		}

		const serviceToken = await step.run("mint-service-token", async () => {
			const { mintServiceToken } = await import(
				"@lib/server/service-token"
			);
			return await mintServiceToken("inngest-conversation-worker");
		});

		// Fetch all project files with their storage URLs
		const files = (await step.run("fetch-project-files", async () => {
			const convexClient = await getMachineConvexClient(serviceToken);

			const files = (await convexClient.query(
				api.system.files.getFilesWithUrls,
				{
					projectId: projectId as Id<"projects">,
				},
			)) satisfies FileWithUrl[];

			return files;
		})) as FileWithUrl[];

		// Create blobs for all files
		const blobShaMapRecord = await step.run("create-blobs", async () => {
			const blobShaMap = await createBlobsFromFiles(files, {
				octokit,
				owner: user.login,
				repo: repoName,
			});
			// Convert Map to plain object for Inngest serialization
			return Object.fromEntries(blobShaMap);
		});

		// Convert back to Map for buildTreeNodes
		const blobShaMap = new Map(Object.entries(blobShaMapRecord));

		// Build tree structure from blobs and files
		const treeNodes = (await step.run("build-tree", async () => {
			return buildTreeNodes(files, blobShaMap);
		})) as Array<{
			path: string;
			mode: string;
			type: "blob" | "tree";
			sha?: string;
		}>;

		if (treeNodes.length === 0) {
			throw new Error("No files to export. Tree is empty.");
		}

		// Create a new tree with all the blobs
		const { data: newTree } = (await step.run("create-tree", async () => {
			return await octokit.rest.git.createTree({
				owner: user.login,
				repo: repoName,
				tree: treeNodes.map((node) => ({
					path: node.path,
					mode: node.mode as "100644" | "100755" | "040000",
					type: node.type,
					sha: node.sha,
				})),
			});
		})) as Awaited<ReturnType<typeof octokit.rest.git.createTree>>;

		// Get the initial commit to use as parent
		await step.run("get-initial-commit-data", async () => {
			return await octokit.rest.git.getCommit({
				owner: user.login,
				repo: repoName,
				commit_sha: commitSha,
			});
		});

		// Create a new commit with the tree
		const { data: newCommit } = (await step.run(
			"create-commit",
			async () => {
				return await octokit.rest.git.createCommit({
					owner: user.login,
					repo: repoName,
					message: "Exported from Caret",
					tree: newTree.sha,
					parents: [commitSha],
				});
			},
		)) as Awaited<ReturnType<typeof octokit.rest.git.createCommit>>;

		// Update the main branch to point to the new commit
		await step.run("update-ref", async () => {
			await octokit.rest.git.updateRef({
				owner: user.login,
				repo: repoName,
				ref: "heads/main",
				sha: newCommit.sha,
			});
		});

		// Update project status to completed
		await step.run("finalize-export", async () => {
			await updateProjectStatus({
				projectId: projectId,
				payload: {
					type: "export",
					status: "completed",
					repoUrl: repo.html_url,
				},
			});
		});

		return {
			success: true,
			projectId,
			repoUrl: repo.html_url,
			filesExported: files.length,
		};
	},
);
