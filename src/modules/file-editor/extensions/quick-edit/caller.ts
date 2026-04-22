import { toast } from "sonner";
import { z } from "zod";
import { consumeAiStream } from "@/lib/ai-stream-client";
import {
	type QuickEditRequest,
	quickEditRequestSchema,
	quickEditResponseSchema,
} from "@/lib/schemas/ai/quick-edit";

export async function quickEditCaller(
	payload: QuickEditRequest,
	signal: AbortSignal,
	onChunk?: (editedCode: string) => void,
): Promise<string | null> {
	try {
		const validatedPayload = quickEditRequestSchema.parse(payload);

		const editedCode = await consumeAiStream({
			url: "/api/ai/quick-edit",
			payload: validatedPayload,
			signal,
			onChunk: (accumulated) => {
				onChunk?.(accumulated);
			},
		});

		if (editedCode === null) {
			return null;
		}

		const validatedResponse = quickEditResponseSchema.parse({ editedCode });

		return validatedResponse.editedCode;
	} catch (err) {
		if (err instanceof z.ZodError) {
			toast.error("Failed to fetch quick edit");
			console.error("Validation error:", err.message);
			return null;
		} else if (err instanceof Error && err.name === "AbortError") {
			console.warn("Quick edit request was aborted.");
			return null;
		} else {
			toast.error("Failed to fetch quick edit");
			console.error("Error fetching quick edit:", err);
			return null;
		}
	}
}
