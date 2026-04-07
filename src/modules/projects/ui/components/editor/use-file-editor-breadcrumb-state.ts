import { api } from "@convex/_generated/api";
import { useFileEditorStore } from "@modules/projects/stores/use-file-editor-store";
import { useQuery } from "convex/react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function useFileEditorBreadcrumbState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	const projectFileState = useFileEditorStore((state) =>
		state.projectFileStates.get(project._id),
	);
	const openFiles = projectFileState?.openFiles ?? [];
	const activeFileId = projectFileState?.activeFileId ?? null;
	const previewFileId = projectFileState?.previewFileId ?? null;

	const activePath = useQuery(
		api.files.getOwnedPathToRoot,
		activeFileId
			? {
					fileId: activeFileId,
				}
			: "skip",
	);

	const activeFile = useQuery(
		api.files.getOwnedById,
		activeFileId
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
