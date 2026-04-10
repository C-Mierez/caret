import "server-only";

import { api } from "@convex/_generated/api";
import { URLs } from "@lib/urls";
import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import ProjectsGetOwnedAll from "../projects-getOwnedAll";
import type { ServerComponent } from "./types";
import { createProtectedDataHoc } from "./utils";

export function withProjectsGetOwnedAll<Props extends object = object>(
	Component: ServerComponent<Props>,
) {
	return createProtectedDataHoc<
		Props,
		Awaited<ReturnType<typeof preloadQuery>>
	>({
		errorMessage: "Error fetching projects:",
		getData: (_props, token) =>
			preloadQuery(api.projects.getOwnedAll, {}, { token }),
		render: ({ props, data: initialProjects, Component }) => {
			if (!initialProjects) redirect(URLs.root);

			return (
				<ProjectsGetOwnedAll initialProjects={initialProjects}>
					<Component {...props} />
				</ProjectsGetOwnedAll>
			);
		},
	})(Component);
}
