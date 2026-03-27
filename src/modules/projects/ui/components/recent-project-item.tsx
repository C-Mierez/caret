import type { Doc } from "@convex/_generated/dataModel";
import { formatDistance } from "date-fns";

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
		<div className="flex justify-between items-center gap-2">
			<p className="text-sm line-clamp-1 flex-1">{project.name}</p>
			<p className="text-muted-foreground-alt text-sm line-clamp-1">
				{timeAgo}
			</p>
		</div>
	);
}
