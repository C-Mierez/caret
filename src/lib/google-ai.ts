import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { gemini } from "@inngest/agent-kit";
import { env } from "@/env";

export const DEFAULT_GEMINI_MODEL = "gemini-3.1-flash-lite-preview";
// export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";
// export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

export const google = createGoogleGenerativeAI({
	apiKey: env.GEMINI_API_KEY,
});

export const geminiModel = gemini({
	model: DEFAULT_GEMINI_MODEL,
	apiKey: env.GEMINI_API_KEY,
	defaultParameters: {
		generationConfig: {
			thinkingConfig: {
				thinkingLevel: "LOW",
			},
		},
	},
});
