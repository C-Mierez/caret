import ky from "ky";
import { toast } from "sonner";
import { z } from "zod";
import {
	type QuickEditRequest,
	type QuickEditResponse,
	quickEditRequestSchema,
	quickEditResponseSchema,
} from "@/lib/schemas/ai/quick-edit";

export async function quickEditCaller(
	payload: QuickEditRequest,
	signal: AbortSignal,
): Promise<string | null> {
	try {
		const validatedPayload = quickEditRequestSchema.parse(payload);

		const response = await ky
			.post("/api/ai/quick-edit", {
				json: validatedPayload,
				signal,
				timeout: 10_000,
				retry: 0,
			})
			.json<QuickEditResponse>();

		const validatedResponse = quickEditResponseSchema.parse(response);

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
