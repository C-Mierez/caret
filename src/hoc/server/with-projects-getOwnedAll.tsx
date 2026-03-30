import "server-only";

import { api } from "@convex/_generated/api";
import { getOrRedirectConvexToken } from "@lib/server-auth";
import { URLs } from "@lib/urls";
import { preloadQuery } from "convex/nextjs";
import { redirect } from "next/navigation";
import ProjectsGetOwnedAll from "../projects-getOwnedAll";
import type { ServerComponent } from "./types";
import { safeServerQuery } from "./utils";

export function withProjectsGetOwnedAll<Props extends object = object>(
	Component: ServerComponent<Props>,
) {
	return async function WithProjectsGetOwnedAll(props: Props) {
		const token = await getOrRedirectConvexToken();

		const initialProjects = await safeServerQuery(
			() => preloadQuery(api.projects.getOwnedAll, {}, { token }),
			"Error fetching projects:",
		);

		if (!initialProjects) redirect(URLs.root);

		return (
			<ProjectsGetOwnedAll initialProjects={initialProjects}>
				<Component {...props} />
			</ProjectsGetOwnedAll>
		);
	};
}
