"use client";

import { buildProjectUrl } from "@lib/urls";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { useProjectsGetOwnedInfinite } from "@/hoc/projects-getOwnedInfinite";
import ProjectImportStatusIcon from "./project-import-status-icon";

export function RecentProjectCard() {
	const { featuredProject: data } = useProjectsGetOwnedInfinite();

	const timeAgo = useMemo(() => {
		if (!data) return "";

		return formatDistanceToNow(new Date(data.updated_at), {
			addSuffix: true,
		});
	}, [data]);

	if (!data) {
		return (
			<div className="bg-muted border border-muted-foreground-alt grid p-4 md:p-8 place-items-center text-muted-foreground-alt">
				No recent projects found
			</div>
		);
	}

	return (
		<Link
			href={buildProjectUrl(data._id)}
			className="bg-muted border border-muted-foreground-alt flex p-4 md:p-8 gap-3 flex-col group hover:border-muted-foreground animated"
		>
			<div className="flex justify-between gap-2 items-center">
				<div className="flex gap-2 items-center text-xl line-clamp-1">
					<ProjectImportStatusIcon
						status={data.importStatus}
						className="text-muted-foreground size-5"
					/>
					<span>{data.name}</span>
				</div>
				<ArrowRight className="text-muted-foreground group-hover:text-foreground animated" />
			</div>
			<p className="text-muted-foreground-alt group-hover:text-muted-foreground animated">
				{timeAgo}
			</p>
		</Link>
	);
}
