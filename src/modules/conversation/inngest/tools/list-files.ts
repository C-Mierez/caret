import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { getMachineConvexClient } from "@lib/server/convex";
import { z } from "zod";

const schema = z.object({
	projectId: z.string().min(1, "Project ID cannot be empty"),
	parentId: z.optional(z.string()),
});

export const listFiles = createTool({
	name: "list-files",
	description:
		"List all files and folders in a specific project directory. Returns a sorted list of files (files first, then folders) with their metadata including names, types, and IDs. Optionally filter by parent folder.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("list-files", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const convexClient = await getMachineConvexClient(serviceToken);

				const files = await convexClient.query(
					api.system.getOwnedSorted,
					{
						projectId: input.projectId as Id<"projects">,
						parentId: input.parentId
							? (input.parentId as Id<"files">)
							: undefined,
					},
				);

				if (!files) {
					return "Error: Could not retrieve files for the project.";
				}

				return JSON.stringify({
					files: files.map((file) => ({
						id: file._id,
						name: file.name,
						type: file.type,
						updatedAt: file.updatedAt,
					})),
				});
			});
		} catch (e) {
			return `Error listing files: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
