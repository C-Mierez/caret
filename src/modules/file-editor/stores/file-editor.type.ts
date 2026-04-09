import type { Id } from "@convex/_generated/dataModel";

export type FileEditorState = {
	openFiles: Id<"files">[];
	activeFileId: Id<"files"> | null;
	previewFileId: Id<"files"> | null;
};

export type FileEditorStore = {
	projectFileStates: Map<Id<"projects">, FileEditorState>;
	getFileState: (projectId: Id<"projects">) => FileEditorState;
	openFile: (projectId: Id<"projects">, fileId: Id<"files">) => void;
	openPreview: (projectId: Id<"projects">, fileId: Id<"files">) => void;
	closeFile: (
		projectId: Id<"projects">,
		fileId: Id<"files">,
	) => Id<"files"> | null;
	closeAllFiles: (projectId: Id<"projects">) => void;
	setActiveFile: (projectId: Id<"projects">, fileId: Id<"files">) => void;
};
