import "server-only";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { getOrRedirectConvexToken } from "@lib/server-auth";
import { URLs } from "@lib/urls";
import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import ProjectsGetOwnedById from "../projects-getOwnedById";
import type { ServerComponent } from "./types";
import { safeServerQuery } from "./utils";

interface Props {
	params: Promise<{
		projectId: string;
	}>;
}

export function withProjectsGetOwnedById<P extends object = object>(
	Component: ServerComponent<P>,
) {
	return async function WithProjectsGetOwnedById(
		props: P extends Props ? P : never,
	) {
		const token = await getOrRedirectConvexToken();
		const { projectId } = await props.params;

		const project = await safeServerQuery(
			() =>
				preloadQuery(
					api.projects.getOwnedById,
					{ projectId: projectId as Id<"projects"> },
					{ token },
				),
			"Error fetching project:",
		);

		if (!project) redirect(URLs.root);

		return (
			<ProjectsGetOwnedById project={project}>
				<Component {...props} />
			</ProjectsGetOwnedById>
		);
	};
}
