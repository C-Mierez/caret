import "server-only";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { URLs } from "@lib/urls";
import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import ProjectsGetOwnedById from "../projects-getOwnedById";
import type { ServerComponent } from "./types";
import { createProtectedDataHoc } from "./utils";

interface Props {
	params: Promise<{
		projectId: string;
	}>;
}

export function withProjectsGetOwnedById<P extends Props>(
	Component: ServerComponent<P>,
) {
	return createProtectedDataHoc<P, Awaited<ReturnType<typeof preloadQuery>>>({
		errorMessage: "Error fetching project:",
		getData: async (props, token) => {
			const { projectId } = await props.params;

			return preloadQuery(
				api.projects.getOwnedById,
				{ projectId: projectId as Id<"projects"> },
				{ token },
			);
		},
		render: ({ props, data: project, Component }) => {
			if (!project) redirect(URLs.root);

			return (
				<ProjectsGetOwnedById project={project}>
					<Component {...props} />
				</ProjectsGetOwnedById>
			);
		},
	})(Component);
}
