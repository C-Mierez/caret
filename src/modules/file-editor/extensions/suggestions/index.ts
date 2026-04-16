import { StateEffect, StateField } from "@codemirror/state";
import {
	Decoration,
	type DecorationSet,
	type EditorView,
	keymap,
	ViewPlugin,
	type ViewUpdate,
	WidgetType,
} from "@codemirror/view";
import { createDebouncePlugin, isWaitingForSuggestion } from "./utils";

/**
 * StateEffect is the channel to send events to the editor and update the state
 */
export const setSuggestionEffect = StateEffect.define<string | null>();

/**
 * StateField is where the state is held and updated on different transactions.
 * Will be affected by a create() and update() method
 */
const suggestionState = StateField.define<string | null>({
	create() {
		return null; // Initial state is no suggestion
	},
	update(value, transaction) {
		// Listen specifically for the setSuggestionEffect
		// Only return the new value if the effect is setSuggestionEffect
		for (const effect of transaction.effects) {
			if (effect.is(setSuggestionEffect)) {
				return effect.value;
			}
		}
		return value;
	},
});

const renderPlugin = ViewPlugin.fromClass(
	class {
		decorations: DecorationSet;

		constructor(view: EditorView) {
			this.decorations = this.build(view);
		}

		update(update: ViewUpdate) {
			// Rebuild decorations if the suggestionState has changed
			const didSuggestionChange = update.transactions.some((tr) => {
				return tr.effects.some((effect) => {
					return effect.is(setSuggestionEffect);
				});
			});

			const shouldRebuild =
				update.docChanged || update.selectionSet || didSuggestionChange;

			if (shouldRebuild) {
				this.decorations = this.build(update.view);
			}
		}

		build(view: EditorView) {
			if (isWaitingForSuggestion) {
				return Decoration.none; // Don't show any suggestion while waiting for a new one
			}

			// Get the current suggestion from the state
			const suggestion = view.state.field(suggestionState);

			if (!suggestion) return Decoration.none;

			// Create the decoration at the current cursor position
			const cursorPos = view.state.selection.main.head;

			return Decoration.set([
				Decoration.widget({
					widget: new SuggestionWidget(suggestion),
					side: 1, // Place the widget after the cursor
				}).range(cursorPos),
			]);
		}
	},
	{
		decorations: (plugin) => plugin.decorations, // Tell the editor about the custom decorations
	},
);

class SuggestionWidget extends WidgetType {
	constructor(readonly text: string) {
		super();
	}

	toDOM(view: EditorView): HTMLElement {
		const span = document.createElement("span");

		span.textContent = this.text;

		span.style.opacity = "0.4";
		span.style.pointerEvents = "none";

		return span;
	}
}

const acceptSuggestionKeymap = keymap.of([
	{
		key: "Tab",
		run(view: EditorView) {
			const suggestion = view.state.field(suggestionState);

			if (!suggestion) return false; // No suggestion found, so don't handle the key

			const cursor = view.state.selection.main.head;
			view.dispatch({
				changes: { from: cursor, insert: suggestion }, // Insert the new suggestion
				selection: { anchor: cursor + suggestion.length }, // Move the cursor to the end
				effects: setSuggestionEffect.of(null), // Clear the suggestion after accepting
			});

			return true; // Indicate that the key was handled
		},
	},
]);

export function suggestion(fileName: string) {
	return [
		suggestionState,
		createDebouncePlugin(fileName),
		renderPlugin,
		acceptSuggestionKeymap,
	];
}
