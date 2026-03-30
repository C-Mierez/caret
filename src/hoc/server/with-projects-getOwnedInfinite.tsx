import "server-only";

import { api } from "@convex/_generated/api";
import { DEFAULT_PROJECTS_LIMIT } from "@lib/constants";
import { getOrRedirectConvexToken } from "@lib/server-auth";
import { URLs } from "@lib/urls";
import { fetchQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import ProjectsGetOwnedInfinite from "../projects-getOwnedInfinite";
import type { ServerComponent } from "./types";
import { safeServerQuery } from "./utils";

export function withProjectsGetOwnedInfinite<Props extends object = object>(
	Component: ServerComponent<Props>,
) {
	return async function WithProjectsGetOwnedInfinite(props: Props) {
		const token = await getOrRedirectConvexToken();

		const [initialProjectsPage, initialTotalProjects] =
			await safeServerQuery(
				() =>
					Promise.all([
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
					]),
				"Error fetching projects:",
			);

		if (!initialProjectsPage || initialTotalProjects === null) {
			redirect(URLs.root);
		}

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
