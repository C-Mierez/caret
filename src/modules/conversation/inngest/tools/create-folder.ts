import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { getMachineConvexClient } from "@lib/server/convex";
import { z } from "zod";

const schema = z.object({
	projectId: z.string().min(1, "Project ID cannot be empty"),
	name: z.string().min(1, "Folder name cannot be empty"),
	parentId: z.optional(z.string()),
});

export const createFolder = createTool({
	name: "create-folder",
	description:
		"Create a new folder in the user's project with a specified name. The folder can optionally be placed inside a parent folder. Returns success confirmation with the created folder ID.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("create-folder", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const convexClient = await getMachineConvexClient(serviceToken);

				const folderId = await convexClient.mutation(
					api.system.createFolder,
					{
						name: input.name,
						projectId: input.projectId as Id<"projects">,
						parentId: input.parentId
							? (input.parentId as Id<"files">)
							: undefined,
					},
				);

				return JSON.stringify({
					folderName: input.name,
					folderId,
					status: "created",
				});
			});
		} catch (e) {
			return `Error creating folder: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
