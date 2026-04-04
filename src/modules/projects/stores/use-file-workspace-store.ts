import type { Id } from "@convex/_generated/dataModel";
import { create } from "zustand";
import type {
	FileActionTarget,
	FileCreateInputRequest,
	FileCreateInputType,
	FileDeleteRequest,
	FileDuplicateRequest,
	FileOpenRequest,
	FileRenameRequest,
} from "./file-workspace.types";

export interface FileWorkspaceStore {
	nextRequestId: number;
	openRequest: FileOpenRequest | undefined;
	createInputRequest: FileCreateInputRequest | undefined;
	renameRequest: FileRenameRequest | undefined;
	deleteRequest: FileDeleteRequest | undefined;
	duplicateRequest: FileDuplicateRequest | undefined;
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
	openRequest: undefined,
	createInputRequest: undefined,
	renameRequest: undefined,
	deleteRequest: undefined,
	duplicateRequest: undefined,
	requestOpenFile: (fileId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				openRequest: {
					id: nextRequestId,
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
				createInputRequest: {
					id: nextRequestId,
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
				renameRequest: {
					id: nextRequestId,
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
				deleteRequest: {
					id: nextRequestId,
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
				duplicateRequest: {
					id: nextRequestId,
					fileId,
				},
			};
		});
	},
}));
