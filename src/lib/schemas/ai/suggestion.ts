import { z } from "zod";

export const suggestionRequestSchema = z.object({
	fileName: z.string(),
	code: z.string(),
	currentLine: z.string(),
	previousLines: z.array(z.string()),
	textBeforeCursor: z.string(),
	textAfterCursor: z.string(),
	nextLines: z.array(z.string()),
	lineNumber: z.number(),
});

export const suggestionResponseSchema = z.object({
	suggestion: z.string(),
});

export type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;
