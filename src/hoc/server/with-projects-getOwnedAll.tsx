import "server-only";

import { api } from "@convex/_generated/api";
import { getOrRedirectConvexToken } from "@lib/server-auth";
import { preloadQuery } from "convex/nextjs";
import ProjectsGetOwnedAll from "../projects-getOwnedAll";
import type { ServerComponent } from "./types";

export function withProjectsGetOwnedAll<Props extends object = object>(
	Component: ServerComponent<Props>,
) {
	return async function WithProjectsGetOwnedAll(props: Props) {
		const token = await getOrRedirectConvexToken();

		const initialProjects = await preloadQuery(
			api.projects.getOwnedAll,
			{},
			{ token },
		);

		return (
			<ProjectsGetOwnedAll initialProjects={initialProjects}>
				<Component {...props} />
			</ProjectsGetOwnedAll>
		);
	};
}
