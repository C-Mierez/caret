import { z } from "zod";

export const githubImportRequestSchema = z.object({
	url: z.url(),
});
