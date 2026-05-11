"use client";

import SimpleTooltip from "@components/simple-tooltip";
import { buildImportStatusText } from "@lib/utils";
import { useSaveState } from "@modules/file-editor/stores/use-save-state";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import ProjectImportStatusIcon from "../project-import-status-icon";
import ProjectSaveStateIcon from "../project-save-state-icon";

export default function BreadcrumbStatus() {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const isSaving = useSaveState((state) => state.isSaving);

	if (!project) {
		return null;
	}

	return (
		<div className="flex items-center gap-1">
			<SimpleTooltip
				label={{
					text: isSaving ? "Saving..." : "Saved",
				}}
			>
				<ProjectSaveStateIcon
					isSaving={isSaving}
					className="size-4 text-muted-foreground-alt"
				/>
			</SimpleTooltip>

			<SimpleTooltip
				label={{
					text: buildImportStatusText(project.importStatus),
				}}
			>
				<ProjectImportStatusIcon
					status={project.importStatus}
					className="size-4 text-muted-foreground-alt"
				/>
			</SimpleTooltip>
		</div>
	);
}
