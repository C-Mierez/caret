import { z } from "zod";

export const githubExportRequestSchema = z.object({
	projectId: z.string().min(1),
	url: z.url(),
	repositoryName: z.string().min(1).max(100),
	description: z.string().max(1000).optional(),
	visibility: z.enum(["private", "public"]),
});
