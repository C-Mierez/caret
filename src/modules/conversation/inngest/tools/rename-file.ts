import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { getMachineConvexClient } from "@lib/server/convex";
import { z } from "zod";

const schema = z.object({
	fileId: z.string().min(1, "File ID cannot be empty"),
	newName: z.string().min(1, "New name cannot be empty"),
});

export const renameFile = createTool({
	name: "rename-file",
	description:
		"Rename a file or folder in the user's project. Provides validation to ensure the new name does not conflict with existing files or folders in the same directory. Returns success confirmation with the new name.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("rename-file", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const convexClient = await getMachineConvexClient(serviceToken);

				await convexClient.mutation(api.system.renameFile, {
					fileId: input.fileId as Id<"files">,
					newName: input.newName,
				});

				return JSON.stringify({
					fileId: input.fileId,
					newName: input.newName,
					status: "renamed",
				});
			});
		} catch (e) {
			return `Error renaming file: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
