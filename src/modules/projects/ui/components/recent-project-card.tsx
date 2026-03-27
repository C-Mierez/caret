"use client";

import { ArrowRight, Globe } from "lucide-react";
import { useProjectsGetOwnedInfinite } from "@/hoc/projects-getOwnedInfinite";

export function RecentProjectCard() {
	const { featuredProject: data } = useProjectsGetOwnedInfinite();

	if (!data) {
		return (
			<div className="bg-muted border border-muted-foreground-alt grid p-4 md:p-8 place-items-center text-muted-foreground-alt">
				No recent projects found
			</div>
		);
	}

	return (
		<div className="bg-muted border border-muted-foreground-alt flex p-4 md:p-8 gap-8 flex-col">
			<div className="flex justify-between gap-2">
				<div className="flex gap-2 items-center text-xl line-clamp-1">
					<Globe className="text-muted-foreground" />
					{data.name}
				</div>
				<ArrowRight className="text-muted-foreground" />
				{/* TODO Add the remaining project-specific data */}
			</div>
		</div>
	);
}
