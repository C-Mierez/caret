import { api } from "@convex/_generated/api";
import { DEFAULT_PROJECTS_LIMIT } from "@lib/constants";
import { getOrRedirectConvexToken } from "@lib/server-auth";
import { fetchQuery } from "convex/nextjs";
import type React from "react";
import ProjectsGetOwnedInfinite from "./projects-getOwnedInfinite";

export function withProjectsGetOwnedInfinite(Component: React.ComponentType) {
	return async function WithProjectsGetOwnedInfinite() {
		const token = await getOrRedirectConvexToken();

		const [initialProjectsPage, initialTotalProjects] = await Promise.all([
			fetchQuery(
				api.projects.getOwnedInfinite,
				{
					paginationOpts: {
						numItems: DEFAULT_PROJECTS_LIMIT,
						cursor: null,
					},
				},
				{ token },
			),
			fetchQuery(api.projects.getOwnedCount, {}, { token }),
		]);

		return (
			<ProjectsGetOwnedInfinite
				initialData={initialProjectsPage}
				initialTotalProjects={initialTotalProjects}
			>
				<Component />
			</ProjectsGetOwnedInfinite>
		);
	};
}
