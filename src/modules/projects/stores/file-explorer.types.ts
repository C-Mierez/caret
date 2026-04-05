import type { Id } from "@convex/_generated/dataModel";
import type { RequestWithId } from "@hooks/use-request-consumer";

export interface FileExplorerCollapseAllRequest extends RequestWithId {
	type: "collapse-all";
}

export interface FileExplorerSyncSelectionFromEditorRequest
	extends RequestWithId {
	type: "sync-selection-from-editor";
	entryId: Id<"files">;
}

export interface FileExplorerClearSelectionRequest extends RequestWithId {
	type: "clear-selection";
}

export type FileExplorerRequest =
	| FileExplorerCollapseAllRequest
	| FileExplorerSyncSelectionFromEditorRequest
	| FileExplorerClearSelectionRequest;
