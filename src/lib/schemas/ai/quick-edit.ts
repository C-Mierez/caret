import { z } from "zod";

export const quickEditRequestSchema = z.object({
	selectedCode: z.string(),
	fullCode: z.string().optional(),
	instruction: z.string(),
});

export const quickEditResponseSchema = z.object({
	editedCode: z
		.string()
		.describe(
			"The edited version of the selected code based on the instruction",
		),
});

export type QuickEditRequest = z.infer<typeof quickEditRequestSchema>;
export type QuickEditResponse = z.infer<typeof quickEditResponseSchema>;
