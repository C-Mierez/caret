"use client";

import InfiniteScroller from "@components/infinite-scroller";
import { DEFAULT_PROJECTS_LIMIT } from "@lib/constants";
import { useProjectsGetOwnedInfinite } from "@/hoc/projects-getOwnedInfinite";
import RecentProjectItem from "./recent-project-item";

interface Props {
	renderedAt: number;
}

export default function RecentProjectList({ renderedAt }: Props) {
	const {
		recentProjects: data,
		paginatedResult,
		totalProjects,
	} = useProjectsGetOwnedInfinite();

	if (!data || data.length === 0) {
		return (
			<div className="py-3 gap-2 grid place-items-center text-muted-foreground-alt">
				Create more projects to see them here
			</div>
		);
	}

	return (
		<>
			<ul className="flex flex-col py-3 gap-2">
				{data.map((project) => (
					<li key={project._id}>
						<RecentProjectItem
							project={project}
							renderedAt={renderedAt}
						/>
					</li>
				))}
			</ul>
			<InfiniteScroller
				paginatedResult={paginatedResult}
				itemsPerPage={DEFAULT_PROJECTS_LIMIT}
				totalItems={totalProjects}
			/>
		</>
	);
}
