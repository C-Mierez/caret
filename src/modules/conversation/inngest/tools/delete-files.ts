import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { getMachineConvexClient } from "@lib/server/convex";
import { z } from "zod";

const schema = z.object({
	fileIds: z
		.array(z.string().min(1, "File ID cannot be empty"))
		.min(1, "At least one file ID must be provided"),
});

export const deleteFiles = createTool({
	name: "delete-files",
	description:
		"Delete one or more files or folders from the user's project by their IDs. Deleting a folder will recursively delete all its contents. Returns confirmation of deleted items.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("delete-files", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const convexClient = await getMachineConvexClient(serviceToken);

				const results: { id: string; status: string }[] = [];

				for (const fileId of input.fileIds) {
					try {
						await convexClient.mutation(api.system.deleteFile, {
							fileId: fileId as Id<"files">,
						});

						results.push({
							id: fileId,
							status: "deleted",
						});
					} catch (e) {
						results.push({
							id: fileId,
							status: `error: ${e instanceof Error ? e.message : String(e)}`,
						});
					}
				}

				if (results.every((r) => r.status !== "deleted")) {
					return "Error: Failed to delete any files. Check the error messages and try again.";
				}

				return JSON.stringify({
					deletedFiles: results,
				});
			});
		} catch (e) {
			return `Error deleting files: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
