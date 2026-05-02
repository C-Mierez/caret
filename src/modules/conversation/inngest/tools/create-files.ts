import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { createTool } from "@inngest/agent-kit";
import { getMachineConvexClient } from "@lib/server/convex";
import { z } from "zod";

const schema = z.object({
	projectId: z.string().min(1, "Project ID cannot be empty"),
	files: z
		.array(
			z.object({
				name: z.string().min(1, "File name cannot be empty"),
				content: z.string(),
				parentId: z.optional(z.string()),
			}),
		)
		.min(1, "At least one file must be provided"),
});

export const createFiles = createTool({
	name: "create-files",
	description:
		"Create one or more new files in the user's project with specified names and initial content. Each file can optionally be placed in a specific folder. Returns success confirmation with created file IDs.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("create-files", async () => {
				const { mintServiceToken } = await import(
					"@lib/server/service-token"
				);
				const serviceToken = await mintServiceToken(
					"inngest-conversation-worker",
				);

				const convexClient = await getMachineConvexClient(serviceToken);

				const results: {
					name: string;
					status: string;
					message?: string;
					error?: string;
				}[] = [];

				// Group files by parentId for batch creation
				const filesByParent = new Map<
					string | undefined,
					Array<{ name: string; content: string }>
				>();

				for (const file of input.files) {
					const key = file.parentId;
					const filesInParent = filesByParent.get(key);
					if (filesInParent) {
						filesInParent.push({
							name: file.name,
							content: file.content,
						});
					} else {
						filesByParent.set(key, [
							{ name: file.name, content: file.content },
						]);
					}
				}

				// Create files in batches by parent folder
				for (const [parentId, groupedFiles] of filesByParent) {
					try {
						await convexClient.mutation(api.system.createFiles, {
							projectId: input.projectId as Id<"projects">,
							parentId: parentId
								? (parentId as Id<"files">)
								: undefined,
							files: groupedFiles,
						});

						for (const file of groupedFiles) {
							results.push({
								name: file.name,
								status: "created",
							});
						}
					} catch (e) {
						const message =
							e instanceof Error ? e.message : String(e);
						for (const file of groupedFiles) {
							results.push({
								name: file.name,
								status: "error",
								message,
								error: message,
							});
						}
					}
				}

				if (results.every((r) => r.status !== "created")) {
					return {
						filesCreated: results,
						error: "Failed to create any files. Check the error messages and try again.",
					};
				}

				return {
					filesCreated: results,
				};
			});
		} catch (e) {
			return `Error creating files: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
