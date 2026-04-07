import type { Doc, Id } from "@convex/_generated/dataModel";
import { useFileEditorStore } from "@modules/projects/stores/use-file-editor-store";
import { useFileExplorerRequest } from "@modules/projects/stores/use-file-explorer-request";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function useFileEditorNavigationState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	const projectFileState = useFileEditorStore((state) =>
		state.projectFileStates.get(project._id),
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
		if (file._id === activeFileId && file._id !== previewFileId) return;

		openPreview(project._id, file._id);
		requestSyncSelection(file._id);
	};

	const onEntryDoubleClick = (file: Doc<"files">) => {
		openFile(project._id, file._id);
		requestSyncSelection(file._id);
	};

	const onCloseFile = (fileId: Id<"files">) => {
		const nextActiveFileId = closeFile(project._id, fileId);

		if (nextActiveFileId) {
			requestSyncSelection(nextActiveFileId);
			return;
		}

		requestClearSelection();
	};

	return {
		project,
		openFiles,
		activeFileId,
		previewFileId,
		onEntryClick,
		onEntryDoubleClick,
		onCloseFile,
	};
}
