import { createAgent, createNetwork } from "@inngest/agent-kit";
import { geminiModel } from "@lib/google-ai";
import {
	CODING_AGENT_SYSTEM_PROMPT,
	TITLE_GENERATOR_SYSTEM_PROMPT,
} from "./prompts";
import { Tools } from "./tools";

export function createAgentTitleGenerator() {
	return createAgent({
		name: "Conversation Title Generator",
		description:
			"Generates a title for a conversation based on the first user request.",
		system: TITLE_GENERATOR_SYSTEM_PROMPT,
		model: geminiModel,
	});
}

export function createCodingAgentAssistant(
	systemPrompt: string = CODING_AGENT_SYSTEM_PROMPT,
	projectId?: string,
) {
	let finalSystemPrompt = systemPrompt;

	if (projectId) {
		finalSystemPrompt += `\n\n<project_context>
You are working with the following project:
- Project ID: ${projectId}

When calling file operation tools (listFiles, createFiles, deleteFiles, renameFile, updateFile, createFolder), use this project ID.
When creating files at the root level, omit the parentId or set it to undefined.
When creating files in a folder, use the folder ID from listFiles as the parentId.
</project_context>`;
	}

	return createAgent({
		name: "Coding Agent",
		description:
			"An agent that helps with coding tasks, such as writing code, debugging, and explaining code snippets.",
		system: finalSystemPrompt,
		model: geminiModel,
		tools: [
			Tools.readFiles,
			Tools.listFiles,
			Tools.createFiles,
			Tools.updateFile,
			Tools.deleteFiles,
			Tools.renameFile,
			Tools.createFolder,
			Tools.scrapeUrls,
		],
	});
}

export function createCodingAgentNetwork(
	codingAgent: ReturnType<typeof createCodingAgentAssistant>,
) {
	return createNetwork({
		name: "Coding Agent Network",
		agents: [codingAgent],
		maxIter: 15,
		router: ({ network }) => {
			const lastResult = network.state.results.at(-1);

			const hasTextResponse = lastResult?.output.some(
				(m) => m.type === "text" && m.role === "assistant",
			);

			const hasToolCalls = lastResult?.output.some(
				(m) => m.type === "tool_call",
			);

			if (hasTextResponse && !hasToolCalls) {
				return undefined;
			}

			return codingAgent;
		},
	});
}
