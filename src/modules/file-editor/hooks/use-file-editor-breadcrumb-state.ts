import { api } from "@convex/_generated/api";
import { useFileEditorStore } from "@modules/file-editor/stores/use-file-editor-store";
import { useQuery } from "convex/react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function useFileEditorBreadcrumbState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const projectId = project?._id;

	const projectFileState = useFileEditorStore((state) =>
		projectId ? state.projectFileStates.get(projectId) : undefined,
	);
	const openFiles = projectFileState?.openFiles ?? [];
	const activeFileId = projectFileState?.activeFileId ?? null;
	const previewFileId = projectFileState?.previewFileId ?? null;

	const activePath = useQuery(
		api.files.getOwnedPathToRoot,
		projectId && activeFileId
			? {
					fileId: activeFileId,
				}
			: "skip",
	);

	const activeFile = useQuery(
		api.files.getOwnedById,
		projectId && activeFileId
			? {
					fileId: activeFileId,
				}
			: "skip",
	);

	return {
		project,
		openFiles,
		activeFileId,
		previewFileId,
		activePath,
		activeFile,
	};
}
