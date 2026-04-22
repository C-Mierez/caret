import { auth } from "@clerk/nextjs/server";
import { google } from "@lib/google-ai";
import { generateText, Output } from "ai";
import { NextResponse } from "next/server";
import {
	suggestionRequestSchema,
	suggestionResponseSchema,
} from "@/lib/schemas/ai/suggestion";

const SUGGESTION_PROMPT = `You are a code suggestion assistant. You will be given the current line of code where the user's cursor is, and you will suggest a code completion if applicable.

<context>
<file_name>{fileName}</file_name>
<previous_lines>
{previousLines}
</previous_lines>
<current_line number="{lineNumber}">{currentLine}</current_line>
<before_cursor>{textBeforeCursor}</before_cursor>
<after_cursor>{textAfterCursor}</after_cursor>
<next_lines>
{nextLines}
</next_lines>
<full_code>
{code}
</full_code>
</context>

<instructions>
Follow these steps IN ORDER:

1. First, look at next_lines. If next_lines contains ANY code, check if it continues from where the cursor is. If it does, return empty string immediately - the code is already written.

2. Check if before_cursor ends with a complete statement (;, }, )). If yes, return empty string.

3. Only if steps 1 and 2 don't apply: suggest what should be typed at the cursor position, using context from full_code.

Your suggestion is inserted immediately after the cursor, so never suggest code that's already in the file.
</instructions>`;

export async function POST(request: Request) {
	try {
		const { userId } = await auth();

		if (!userId) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{
					status: 401,
				},
			);
		}

		const parsedRequest = suggestionRequestSchema.safeParse(
			await request.json(),
		);

		if (!parsedRequest.success) {
			const codeError = parsedRequest.error.issues.some(
				(issue) => issue.path[0] === "code",
			);

			if (codeError) {
				return NextResponse.json(
					{ error: "Code is required" },
					{
						status: 400,
					},
				);
			}

			return NextResponse.json(
				{ error: "Invalid request body" },
				{
					status: 400,
				},
			);
		}

		const {
			fileName,
			code,
			currentLine,
			previousLines,
			textBeforeCursor,
			textAfterCursor,
			nextLines,
			lineNumber,
		} = parsedRequest.data;

		const prompt = SUGGESTION_PROMPT.replace("{fileName}", fileName)
			.replace("{code}", code)
			.replace("{currentLine}", currentLine)
			.replace("{previousLines}", previousLines.join("\n"))
			.replace("{textBeforeCursor}", textBeforeCursor)
			.replace("{textAfterCursor}", textAfterCursor)
			.replace("{nextLines}", nextLines.join("\n"))
			.replace("{lineNumber}", lineNumber.toString());

		const { output } = await generateText({
			model: google("gemini-3.1-flash-lite-preview"),
			output: Output.object({ schema: suggestionResponseSchema }),
			prompt,
		});

		return NextResponse.json({ suggestion: output.suggestion });
	} catch (err) {
		console.error(err);
		return NextResponse.json(
			{ error: "An error occurred while generating the suggestion" },
			{
				status: 500,
			},
		);
	}
}
