import type { AiStreamEvent } from "@/lib/schemas/ai/stream";

const textEncoder = new TextEncoder();

function encodeEvent(event: AiStreamEvent): Uint8Array {
	return textEncoder.encode(`${JSON.stringify(event)}\n`);
}

function getErrorMessage(err: unknown): string {
	if (err instanceof Error) {
		return err.message;
	}

	return "Unexpected stream error";
}

export function createAiTextStreamResponse(
	textStream: AsyncIterable<string>,
): Response {
	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			try {
				for await (const chunk of textStream) {
					if (!chunk) {
						continue;
					}

					controller.enqueue(encodeEvent({ type: "chunk", chunk }));
				}

				controller.enqueue(encodeEvent({ type: "done" }));
			} catch (err) {
				controller.enqueue(
					encodeEvent({ type: "error", error: getErrorMessage(err) }),
				);
			} finally {
				controller.close();
			}
		},
	});

	return new Response(stream, {
		headers: {
			"Content-Type": "application/x-ndjson; charset=utf-8",
			"Cache-Control": "no-cache, no-transform",
			Connection: "keep-alive",
		},
	});
}
