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
			<div className="grid place-items-center border border-muted-foreground-alt bg-muted p-4 text-muted-foreground-alt md:p-8">
				No recent projects found
			</div>
		);
	}

	return (
		<Link
			href={buildProjectUrl(data._id)}
			className="group animated flex flex-col gap-3 border border-muted-foreground-alt bg-muted p-4 hover:border-muted-foreground md:p-8"
		>
			<div className="flex items-center justify-between gap-2">
				<div className="line-clamp-1 flex items-center gap-2 text-xl">
					<ProjectImportStatusIcon
						status={data.importStatus}
						className="size-5 text-muted-foreground"
					/>
					<span>{data.name}</span>
				</div>
				<ArrowRight className="animated text-muted-foreground group-hover:text-foreground" />
			</div>
			<p className="animated text-muted-foreground-alt group-hover:text-muted-foreground">
				{timeAgo}
			</p>
		</Link>
	);
}
