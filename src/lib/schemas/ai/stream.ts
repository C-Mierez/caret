import { z } from "zod";

export const aiStreamChunkEventSchema = z.object({
	type: z.literal("chunk"),
	chunk: z.string(),
});

export const aiStreamDoneEventSchema = z.object({
	type: z.literal("done"),
});

export const aiStreamErrorEventSchema = z.object({
	type: z.literal("error"),
	error: z.string(),
});

export const aiStreamEventSchema = z.discriminatedUnion("type", [
	aiStreamChunkEventSchema,
	aiStreamDoneEventSchema,
	aiStreamErrorEventSchema,
]);

export type AiStreamEvent = z.infer<typeof aiStreamEventSchema>;
