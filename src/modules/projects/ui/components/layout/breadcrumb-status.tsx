"use client";

import SimpleTooltip from "@components/simple-tooltip";
import { buildImportStatusText } from "@lib/utils";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import ProjectImportStatusIcon from "../project-import-status-icon";

export default function BreadcrumbStatus() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	if (!project) {
		return null;
	}

	return (
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
	);
}
