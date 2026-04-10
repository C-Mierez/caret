import { create } from "zustand";
import type { FileEditorState, FileEditorStore } from "./file-editor.type";

const defaultFileState: FileEditorState = {
	openFiles: [],
	activeFileId: null,
	previewFileId: null,
};

export const useFileEditorStore = create<FileEditorStore>((set, get) => ({
	projectFileStates: new Map(),
	getFileState(projectId) {
		return get().projectFileStates.get(projectId) || defaultFileState;
	},
	openFile(projectId, fileId) {
		const projectFileStates = new Map(get().projectFileStates);
		const state = get().getFileState(projectId);
		const { openFiles, previewFileId } = state;

		const isAlreadyOpen = openFiles.includes(fileId);
		const isAlreadyPreview = previewFileId === fileId;

		if (!isAlreadyOpen) {
			const newOpenFiles = [...openFiles, fileId];

			projectFileStates.set(projectId, {
				...state,
				openFiles: newOpenFiles,
				activeFileId: fileId,
				previewFileId: isAlreadyPreview ? null : previewFileId,
			});

			set({ projectFileStates });
		} else {
			projectFileStates.set(projectId, {
				...state,
				activeFileId: fileId,
				previewFileId: isAlreadyPreview ? null : previewFileId,
			});

			set({ projectFileStates });
		}
	},
	openPreview(projectId, fileId) {
		const projectFileStates = new Map(get().projectFileStates);
		const state = get().getFileState(projectId);
		const { openFiles, previewFileId } = state;

		const isAlreadyOpen = openFiles.includes(fileId);
		const isAlreadyPreview = previewFileId === fileId;

		if (isAlreadyOpen) {
			projectFileStates.set(projectId, {
				...state,
				activeFileId: fileId,
			});

			set({ projectFileStates });
			return;
		}

		if (isAlreadyPreview) {
			projectFileStates.set(projectId, {
				...state,
				activeFileId: fileId,
			});

			set({ projectFileStates });
		} else if (!isAlreadyOpen) {
			projectFileStates.set(projectId, {
				...state,
				activeFileId: fileId,
				previewFileId: fileId,
			});

			set({ projectFileStates });
		}
	},
	closeFile(projectId, fileId) {
		const projectFileStates = new Map(get().projectFileStates);
		const state = get().getFileState(projectId);
		const { openFiles, previewFileId, activeFileId } = state;

		const isAlreadyPreview = previewFileId === fileId;
		const isAlreadyOpen = openFiles.includes(fileId);
		const isActive = activeFileId === fileId;

		if (!isAlreadyOpen && !isAlreadyPreview) {
			return activeFileId;
		}

		const newOpenFiles = openFiles.filter((id) => id !== fileId);
		const newPreviewFileId = isAlreadyPreview ? null : previewFileId;

		const nextActiveFileId = isActive
			? (newPreviewFileId ??
				(newOpenFiles.length > 0
					? newOpenFiles[newOpenFiles.length - 1]
					: null))
			: activeFileId;

		projectFileStates.set(projectId, {
			...state,
			openFiles: newOpenFiles,
			activeFileId: nextActiveFileId,
			previewFileId: newPreviewFileId,
		});

		set({ projectFileStates });
		return nextActiveFileId;
	},
	setActiveFile(projectId, fileId) {
		const projectFileStates = new Map(get().projectFileStates);
		const state = get().getFileState(projectId);
		const { openFiles } = state;

		const isAlreadyOpen = openFiles.includes(fileId);

		if (isAlreadyOpen) {
			projectFileStates.set(projectId, {
				...state,
				activeFileId: fileId,
			});

			set({ projectFileStates });
		}
	},
	closeAllFiles(projectId) {
		const projectFileStates = new Map(get().projectFileStates);

		projectFileStates.set(projectId, {
			...defaultFileState,
		});

		set({ projectFileStates });
	},
}));
