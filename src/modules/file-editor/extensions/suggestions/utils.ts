import { type EditorView, ViewPlugin, type ViewUpdate } from "@codemirror/view";
import { setSuggestionEffect } from ".";

let debounceTimer: number | null = null;
export let isWaitingForSuggestion = false;
const DEBOUNCE_DELAY = 300;

/**
 * Mock function
 */
export function generateFakeSuggestion(
	textBeforeCursor: string,
): string | null {
	const trimmed = textBeforeCursor.trim();

	if (trimmed.endsWith("const")) return "myVariable =";

	return null;
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

				isWaitingForSuggestion = true;

				debounceTimer = window.setTimeout(async () => {
					// TODO Delete this later, just for testing
					const cursor = view.state.selection.main.head;
					const line = view.state.doc.lineAt(cursor);

					const textBeforeCursor = line.text.slice(
						0,
						cursor - line.from,
					);
					const suggestion = generateFakeSuggestion(textBeforeCursor);

					isWaitingForSuggestion = false;

					view.dispatch({
						effects: setSuggestionEffect.of(suggestion),
					});
				}, DEBOUNCE_DELAY);
			}

			destroy() {
				if (debounceTimer !== null) {
					clearTimeout(debounceTimer);
				}
			}
		},
	);
}
