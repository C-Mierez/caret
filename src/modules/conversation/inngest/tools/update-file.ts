import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { getMachineConvexClient } from "@lib/server/convex";
import { z } from "zod";

const schema = z.object({
	fileId: z.string().min(1, "File ID cannot be empty"),
	content: z.string(),
});

export const updateFile = createTool({
	name: "update-file",
	description:
		"Update the content of an existing file in the user's project. Replaces the entire file content with the new content provided. Returns success confirmation.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("update-file", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const convexClient = await getMachineConvexClient(serviceToken);

				await convexClient.mutation(api.system.updateFileContent, {
					fileId: input.fileId as Id<"files">,
					content: input.content,
				});

				return JSON.stringify({
					fileId: input.fileId,
					status: "updated",
				});
			});
		} catch (e) {
			return `Error updating file: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
