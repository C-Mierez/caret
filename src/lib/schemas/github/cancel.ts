import { z } from "zod";

export const githubImportCancelRequestSchema = z.object({
	url: z.url(),
	projectId: z.string().min(1),
});

export const githubExportCancelRequestSchema = z.object({
	projectId: z.string().min(1),
});
