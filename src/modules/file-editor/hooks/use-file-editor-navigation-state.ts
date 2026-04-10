import type { Doc, Id } from "@convex/_generated/dataModel";
import { useFileEditorStore } from "@modules/file-editor/stores/use-file-editor-store";
import { useFileExplorerRequest } from "@modules/file-explorer/stores/use-file-explorer-request";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function useFileEditorNavigationState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const projectId = project?._id;

	const projectFileState = useFileEditorStore((state) =>
		projectId ? state.projectFileStates.get(projectId) : undefined,
	);
	const openFiles = projectFileState?.openFiles ?? [];
	const activeFileId = projectFileState?.activeFileId ?? null;
	const previewFileId = projectFileState?.previewFileId ?? null;

	const requestSyncSelection = useFileExplorerRequest(
		(state) => state.requestSyncSelection,
	);
	const requestClearSelection = useFileExplorerRequest(
		(state) => state.requestClearSelection,
	);

	const openFile = useFileEditorStore((state) => state.openFile);
	const openPreview = useFileEditorStore((state) => state.openPreview);
	const closeFile = useFileEditorStore((state) => state.closeFile);

	const onEntryClick = (file: Doc<"files">) => {
		if (!projectId) return;

		if (file._id === activeFileId && file._id !== previewFileId) return;

		openPreview(projectId, file._id);
		requestSyncSelection(file._id);
	};

	const onEntryDoubleClick = (file: Doc<"files">) => {
		if (!projectId) return;

		openFile(projectId, file._id);
		requestSyncSelection(file._id);
	};

	const onCloseFile = (fileId: Id<"files">) => {
		if (!projectId) return;

		const nextActiveFileId = closeFile(projectId, fileId);

		if (nextActiveFileId) {
			requestSyncSelection(nextActiveFileId);
			return;
		}

		requestClearSelection();
	};

	return {
		projectId,
		openFiles,
		activeFileId,
		previewFileId,
		onEntryClick,
		onEntryDoubleClick,
		onCloseFile,
	};
}
