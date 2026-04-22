import { toast } from "sonner";
import { z } from "zod";
import { consumeAiStream } from "@/lib/ai-stream-client";
import {
	type SuggestionRequest,
	suggestionRequestSchema,
	suggestionResponseSchema,
} from "@/lib/schemas/ai/suggestion";

export async function suggestionCaller(
	payload: SuggestionRequest,
	signal: AbortSignal,
	onChunk?: (suggestion: string) => void,
): Promise<string | null> {
	try {
		const validatedPayload = suggestionRequestSchema.parse(payload);

		const suggestion = await consumeAiStream({
			url: "/api/ai/suggestion",
			payload: validatedPayload,
			signal,
			onChunk: (accumulated) => {
				onChunk?.(accumulated);
			},
		});

		if (suggestion === null) {
			return null;
		}

		const validatedResponse = suggestionResponseSchema.parse({
			suggestion,
		});

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
