import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

export default function useProjectCreate() {
	return useMutation(api.projects.create).withOptimisticUpdate(
		(localStore, args) => {
			const now = Date.now();
			const newProject = {
				_id: crypto.randomUUID() as Id<"projects">,
				_creationTime: now,
				name: args.name,
				ownerId: "temp-id",
				updated_at: now,
				exportStatus: "not_started",
				importStatus: "not_started",
			} satisfies Doc<"projects">;

			// Optimistic update for projects.getOwnedInfinite
			for (const cachedQuery of localStore.getAllQueries(
				api.projects.getOwnedInfinite,
			)) {
				if (cachedQuery.value === undefined) {
					continue;
				}

				if (cachedQuery.args.paginationOpts.cursor !== null) {
					continue;
				}

				localStore.setQuery(
					api.projects.getOwnedInfinite,
					cachedQuery.args,
					{
						...cachedQuery.value,
						page: [newProject, ...cachedQuery.value.page],
					},
				);
			}

			// TODO Optimistic update for projects.getOwnedAll if needed
		},
	);
}
