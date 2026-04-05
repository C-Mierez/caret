import type { Id } from "@convex/_generated/dataModel";
import { create } from "zustand";
import type {
	FileActionTarget,
	FileCreateInputType,
	FileWorkspaceRequest,
} from "./file-workspace.types";

export interface FileWorkspaceStore {
	nextRequestId: number;
	request: FileWorkspaceRequest | undefined;
	requestOpenFile: (fileId: Id<"files">) => void;
	requestCreateInput: (
		inputType: FileCreateInputType,
		parentId?: Id<"files">,
	) => void;
	requestRenameInput: (fileId: Id<"files">) => void;
	requestDeleteFile: (file: FileActionTarget) => void;
	requestDuplicateFile: (fileId: Id<"files">) => void;
}

export const useFileWorkspaceStore = create<FileWorkspaceStore>((set) => ({
	nextRequestId: 0,
	request: undefined,
	requestOpenFile: (fileId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "open",
					fileId,
				},
			};
		});
	},
	requestCreateInput: (inputType, parentId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "create-input",
					inputType,
					parentId,
				},
			};
		});
	},
	requestRenameInput: (fileId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "rename",
					fileId,
				},
			};
		});
	},
	requestDeleteFile: (file) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "delete",
					file,
				},
			};
		});
	},
	requestDuplicateFile: (fileId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				request: {
					id: nextRequestId,
					type: "duplicate",
					fileId,
				},
			};
		});
	},
}));
