import { type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { setSuggestionEffect } from ".";
import { type SuggestionRequest, suggestionCaller } from "./caller";

let debounceTimer: number | null = null;
export let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 300;
let currentAboutController: AbortController | null = null;

/**
 * Mock function for testing purposes
 */
// export function generateFakeSuggestion(
// 	textBeforeCursor: string,
// ): string | null {
// 	const trimmed = textBeforeCursor.trim();

// 	if (trimmed.endsWith("const")) return "myVariable =";

// 	return null;
// }

export function generateSuggestionRequest(
	view: EditorView,
	fileName: string,
): SuggestionRequest | null {
	const code = view.state.doc.toString();

	if (!code || code.trim() === "") return null;

	const cursor = view.state.selection.main.head;
	const line = view.state.doc.lineAt(cursor);
	const cursorInLine = cursor - line.from;

	const previousLines: string[] = [];
	const previousLinesToFetch = Math.min(20, line.number - 1);

	for (let i = previousLinesToFetch; i >= 1; i--) {
		previousLines.push(view.state.doc.line(line.number - i).text);
	}

	const nextLines: string[] = [];
	const totalLines = view.state.doc.lines;
	const nextLinesToFetch = Math.min(20, totalLines - line.number);

	for (let i = 1; i <= nextLinesToFetch; i++) {
		nextLines.push(view.state.doc.line(line.number + i).text);
	}

	return {
		fileName,
		code,
		currentLine: line.text,
		previousLines,
		textBeforeCursor: line.text.slice(0, cursorInLine),
		textAfterCursor: line.text.slice(cursorInLine),
		nextLines,
		lineNumber: line.number,
	};
}

export function createDebouncePlugin(fileName: string) {
	return ViewPlugin.fromClass(
		class {
			constructor(view: EditorView) {
				this.triggerSuggestion(view);
			}

			update(update: ViewUpdate) {
				if (update.docChanged || update.selectionSet) {
					this.triggerSuggestion(update.view);
				}
			}

			triggerSuggestion(view: EditorView) {
				if (debounceTimer) {
					clearTimeout(debounceTimer);
				}

				if (currentAboutController !== null)
					currentAboutController.abort();

				isWaitingForSuggestion = true;

				// async function generateSuggestionMock() {
				// 	// Just for testing
				// 	const cursor = view.state.selection.main.head;
				// 	const line = view.state.doc.lineAt(cursor);

				// 	const textBeforeCursor = line.text.slice(
				// 		0,
				// 		cursor - line.from,
				// 	);
				// 	const suggestion = generateFakeSuggestion(textBeforeCursor);

				// 	isWaitingForSuggestion = false;

				// 	view.dispatch({
				// 		effects: setSuggestionEffect.of(suggestion),
				// 	});
				// }
				async function generateSuggestion() {
					const request = generateSuggestionRequest(view, fileName);

					if (!request) {
						isWaitingForSuggestion = false;
						view.dispatch({
							effects: setSuggestionEffect.of(null),
						});
						return;
					}

					currentAboutController = new AbortController();

					const suggestion = await suggestionCaller(
						request,
						currentAboutController.signal,
					);

					isWaitingForSuggestion = false;

					view.dispatch({
						effects: setSuggestionEffect.of(suggestion),
					});
				}

				debounceTimer = window.setTimeout(
					generateSuggestion,
					DEBOUNCE_DELAY,
				);
			}

			destroy() {
				if (debounceTimer !== null) {
					clearTimeout(debounceTimer);
				}
				if (currentAboutController !== null) {
					currentAboutController.abort();
				}
			}
		},
	);
}
