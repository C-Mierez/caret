import type { Doc } from "@convex/_generated/dataModel";
import { buildProjectUrl } from "@lib/urls";
import { formatDistance } from "date-fns";
import Link from "next/link";
import ProjectImportStatusIcon from "./project-import-status-icon";

interface Props {
	project: Doc<"projects">;
	renderedAt: number;
}

export default function RecentProjectItem({ project, renderedAt }: Props) {
	const timeAgo = formatDistance(
		new Date(project.updated_at),
		new Date(renderedAt),
		{
			addSuffix: true,
		},
	);

	return (
		<Link
			href={buildProjectUrl(project._id)}
			className="group flex items-center justify-between gap-2 py-1.5"
		>
			<div className="flex items-center gap-2">
				<ProjectImportStatusIcon
					status={project.importStatus}
					className="size-4 text-muted-foreground-alt group-hover:text-muted-foreground"
				/>
				<p className="line-clamp-1 flex-1 text-muted-foreground text-sm group-hover:text-foreground">
					{project.name}
				</p>
			</div>
			<p className="line-clamp-1 text-muted-foreground-alt text-sm group-hover:text-muted-foreground">
				{timeAgo}
			</p>
		</Link>
	);
}
