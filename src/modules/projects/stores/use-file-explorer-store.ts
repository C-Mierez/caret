import type { Id } from "@convex/_generated/dataModel";
import { create } from "zustand";
import type { FileExplorerRequest } from "./file-explorer.types";

export interface FileExplorerStore {
	nextRequestId: number;
	request: FileExplorerRequest | undefined;
	requestCollapseAll: () => void;
	requestSyncSelection: (entryId: Id<"files">) => void;
	requestClearSelection: () => void;
}

export const useFileExplorerStore = create<FileExplorerStore>((set) => ({
	nextRequestId: 0,
	request: undefined,
	requestCollapseAll: () => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "collapse-all",
				},
			};
		});
	},
	requestSyncSelection: (entryId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "sync-selection-from-editor",
					entryId,
				},
			};
		});
	},
	requestClearSelection: () => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "clear-selection",
				},
			};
		});
	},
}));
