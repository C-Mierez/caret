import ky from "ky";
import { toast } from "sonner";
import { z } from "zod";
import {
	type SuggestionRequest,
	type SuggestionResponse,
	suggestionRequestSchema,
	suggestionResponseSchema,
} from "@/lib/schemas/ai/suggestion";

export async function suggestionCaller(
	payload: SuggestionRequest,
	signal: AbortSignal,
): Promise<string | null> {
	try {
		const validatedPayload = suggestionRequestSchema.parse(payload);

		const response = await ky.post("/api/ai/suggestion", {
			json: validatedPayload,
			signal,
			timeout: 10_000,
			retry: 0,
			throwHttpErrors: false,
		});

		const contentType = response.headers.get("content-type") || "";

		if (!response.ok) {
			console.error("Suggestion request failed:", {
				status: response.status,
				statusText: response.statusText,
			});
			return null;
		}

		if (!contentType.includes("application/json")) {
			console.error("Suggestion request returned non-JSON response:", {
				contentType,
				redirected: response.redirected,
				url: response.url,
			});
			return null;
		}

		const parsedResponse = (await response.json()) as SuggestionResponse;

		const validatedResponse =
			suggestionResponseSchema.parse(parsedResponse);

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
