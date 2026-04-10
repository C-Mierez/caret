import "server-only";

import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { DEFAULT_PROJECTS_LIMIT } from "@lib/constants";
import { URLs } from "@lib/urls";
import { fetchQuery } from "convex/nextjs";
import type { PaginationResult } from "convex/server";
import { redirect } from "next/navigation";
import ProjectsGetOwnedInfinite from "../projects-getOwnedInfinite";
import type { ServerComponent } from "./types";
import { createProtectedDataHoc } from "./utils";

type InitialProjectsPayload = [PaginationResult<Doc<"projects">>, number];

export function withProjectsGetOwnedInfinite<Props extends object = object>(
	Component: ServerComponent<Props>,
) {
	return createProtectedDataHoc<Props, InitialProjectsPayload>({
		errorMessage: "Error fetching projects:",
		getData: (_props, token) =>
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
		render: ({
			props,
			data: [initialProjectsPage, initialTotalProjects],
			Component,
		}) => {
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
		},
	})(Component);
}
