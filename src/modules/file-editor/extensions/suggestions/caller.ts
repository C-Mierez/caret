import ky from "ky";
import { toast } from "sonner";
import { z } from "zod";

const suggestionRequestSchema = z.object({
	fileName: z.string(),
	code: z.string(),
	currentLine: z.string(),
	previousLines: z.array(z.string()),
	textBeforeCursor: z.string(),
	textAfterCursor: z.string(),
	nextLines: z.array(z.string()),
	lineNumber: z.number(),
});

const suggestionResponseSchema = z.object({
	suggestion: z.string(),
});

export type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
export type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;

export async function suggestionCaller(
	payload: SuggestionRequest,
	signal: AbortSignal,
): Promise<string | null> {
	try {
		const validatedPayload = suggestionRequestSchema.parse(payload);

		const response = await ky
			.post("/api/ai/suggestion", {
				json: validatedPayload,
				signal,
				timeout: 10_000,
				retry: 0,
			})
			.json<SuggestionResponse>();

		const validatedResponse = suggestionResponseSchema.parse(response);

		return validatedResponse.suggestion;
	} catch (err) {
		if (err instanceof z.ZodError) {
			toast.error("Failed to fetch suggestion");
			console.error("Validation error:", err.message);
			return null;
		} else if (err instanceof Error && err.name === "AbortError") {
			console.warn("Suggestion request was aborted.");
			return null;
		} else {
			toast.error("Failed to fetch suggestion");
			console.error("Error fetching suggestion:", err);
			return null;
		}
	}
}
