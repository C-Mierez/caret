import { z } from "zod";

export const githubExportRequestSchema = z.object({
	projectId: z.string().min(1),
	url: z.url(),
});
