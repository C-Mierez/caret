import type { Id } from "@convex/_generated/dataModel";
import { create } from "zustand";

interface RenameRequest {
	id: number;
	fileId: Id<"files">;
}

interface OpenRequest {
	id: number;
	fileId: Id<"files">;
}

interface DeleteRequest {
	id: number;
	fileId: Id<"files">;
}

interface DuplicateRequest {
	id: number;
	fileId: Id<"files">;
}

interface FileWorkspaceStore {
	nextRequestId: number;
	openRequest: OpenRequest | undefined;
	renameRequest: RenameRequest | undefined;
	deleteRequest: DeleteRequest | undefined;
	duplicateRequest: DuplicateRequest | undefined;
	requestOpenFile: (fileId: Id<"files">) => void;
	requestRenameInput: (fileId: Id<"files">) => void;
	requestDeleteFile: (fileId: Id<"files">) => void;
	requestDuplicateFile: (fileId: Id<"files">) => void;
}

export const useFileWorkspaceStore = create<FileWorkspaceStore>((set) => ({
	nextRequestId: 0,
	openRequest: undefined,
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
	requestDeleteFile: (fileId) => {
		set((state) => {
			const nextRequestId = state.nextRequestId + 1;

			return {
				nextRequestId,
				deleteRequest: {
					id: nextRequestId,
					fileId,
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
