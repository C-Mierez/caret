import type { Doc, Id } from "@convex/_generated/dataModel";

export type FileTreeCommand =
	| {
			id: number;
			type: "open-create-input";
			inputType: Doc<"files">["type"];
	  }
	| {
			id: number;
			type: "collapse-all";
	  }
	| {
			id: number;
			type: "sync-selection-from-editor";
			entryId: Id<"files">;
	  }
	| {
			id: number;
			type: "clear-selection";
	  };
