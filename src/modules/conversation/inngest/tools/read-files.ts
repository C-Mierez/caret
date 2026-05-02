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

export const readFiles = createTool({
	name: "read-files",
	description:
		"Read the contents of one or more files in the user's project. Returns the file contents.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("read-files", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const results: { id: string; name: string; content: string }[] =
					[];

				const convexClient = await getMachineConvexClient(serviceToken);

				for (const fileId of input.fileIds) {
					let file:
						| {
								name: string;
								content?: string;
						  }
						| undefined;

					try {
						file = await convexClient.query(
							api.system.getFileById,
							{ fileId: fileId as Id<"files"> },
						);
					} catch {
						continue;
					}

					if (file?.content !== undefined) {
						results.push({
							id: fileId,
							name: file.name,
							content: file.content,
						});
					}
				}

				if (results.length === 0) {
					return "Error: None of the specified files could be read. Use listFiles to verify the file IDs and try again.";
				}

				return JSON.stringify({ files: results });
			});
		} catch (e) {
			return `Error reading files: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
