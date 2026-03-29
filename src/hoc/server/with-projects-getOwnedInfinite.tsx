import "server-only";

import { api } from "@convex/_generated/api";
import { DEFAULT_PROJECTS_LIMIT } from "@lib/constants";
import { getOrRedirectConvexToken } from "@lib/server-auth";
import { fetchQuery } from "convex/nextjs";
import ProjectsGetOwnedInfinite from "../projects-getOwnedInfinite";
import type { ServerComponent } from "./types";

export function withProjectsGetOwnedInfinite<Props extends object = object>(
	Component: ServerComponent<Props>,
) {
	return async function WithProjectsGetOwnedInfinite(props: Props) {
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
				<Component {...props} />
			</ProjectsGetOwnedInfinite>
		);
	};
}
