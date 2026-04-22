import {
	type AiStreamEvent,
	aiStreamEventSchema,
} from "@/lib/schemas/ai/stream";

type ConsumeAiStreamOptions<TPayload> = {
	url: string;
	payload: TPayload;
	signal: AbortSignal;
	onChunk?: (accumulated: string, chunk: string) => void;
};

function parseJsonErrorMessage(value: unknown): string | null {
	if (typeof value === "object" && value !== null && "error" in value) {
		const errorValue = value.error;
		if (typeof errorValue === "string" && errorValue.length > 0) {
			return errorValue;
		}
	}

	return null;
}

function applyStreamEvent(
	event: AiStreamEvent,
	accumulated: string,
	onChunk?: (nextAccumulated: string, chunk: string) => void,
): { accumulated: string; isTerminal: boolean; failed: boolean } {
	if (event.type === "chunk") {
		const nextAccumulated = `${accumulated}${event.chunk}`;
		onChunk?.(nextAccumulated, event.chunk);
		return {
			accumulated: nextAccumulated,
			isTerminal: false,
			failed: false,
		};
	}

	if (event.type === "error") {
		console.error("AI stream error event:", event.error);
		return { accumulated, isTerminal: true, failed: true };
	}

	return { accumulated, isTerminal: true, failed: false };
}

export async function consumeAiStream<TPayload>({
	url,
	payload,
	signal,
	onChunk,
}: ConsumeAiStreamOptions<TPayload>): Promise<string | null> {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(payload),
		signal,
	});

	if (!response.ok) {
		const contentType = response.headers.get("content-type") ?? "";
		let errorMessage = "Request failed";

		if (contentType.includes("application/json")) {
			try {
				const parsed = await response.json();
				errorMessage = parseJsonErrorMessage(parsed) ?? errorMessage;
			} catch {
				// Keep generic error message when JSON parsing fails.
			}
		}

		console.error("AI stream request failed:", {
			status: response.status,
			statusText: response.statusText,
			errorMessage,
		});
		return null;
	}

	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("application/x-ndjson")) {
		console.error("AI stream request returned unsupported content type:", {
			contentType,
		});
		return null;
	}

	if (!response.body) {
		console.error("AI stream response body is missing.");
		return null;
	}

	const reader = response.body.getReader();
	const textDecoder = new TextDecoder();
	let buffer = "";
	let accumulated = "";

	while (true) {
		const { done, value } = await reader.read();

		if (done) {
			break;
		}

		buffer += textDecoder.decode(value, { stream: true });

		let newlineIndex = buffer.indexOf("\n");
		while (newlineIndex !== -1) {
			const line = buffer.slice(0, newlineIndex).trim();
			buffer = buffer.slice(newlineIndex + 1);

			if (line.length > 0) {
				let parsedLine: unknown;
				try {
					parsedLine = JSON.parse(line);
				} catch {
					console.error("AI stream line is not valid JSON.", {
						line,
					});
					return null;
				}

				const parsedEvent = aiStreamEventSchema.safeParse(parsedLine);
				if (!parsedEvent.success) {
					console.error("AI stream event validation failed:", {
						issues: parsedEvent.error.issues,
					});
					return null;
				}

				const eventResult = applyStreamEvent(
					parsedEvent.data,
					accumulated,
					onChunk,
				);

				accumulated = eventResult.accumulated;

				if (eventResult.isTerminal) {
					return eventResult.failed ? null : accumulated;
				}
			}

			newlineIndex = buffer.indexOf("\n");
		}
	}

	buffer += textDecoder.decode();
	if (buffer.trim().length > 0) {
		console.error("AI stream ended with unterminated event payload.");
		return null;
	}

	return accumulated;
}
