import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useMutation } from "convex/react";

export default function useProjectCreate() {
	return useMutation(api.user.projects.create).withOptimisticUpdate(
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
				api.user.projects.getOwnedInfinite,
			)) {
				if (cachedQuery.value === undefined) {
					continue;
				}

				if (cachedQuery.args.paginationOpts.cursor !== null) {
					continue;
				}

				localStore.setQuery(
					api.user.projects.getOwnedInfinite,
					cachedQuery.args,
					{
						...cachedQuery.value,
						page: [newProject, ...cachedQuery.value.page],
					},
				);
			}

			// Optimistic update for projects.getOwnedAll
			const cachedQuery = localStore.getQuery(
				api.user.projects.getOwnedAll,
				{},
			);
			if (cachedQuery !== undefined) {
				localStore.setQuery(api.user.projects.getOwnedAll, {}, [
					newProject,
					...cachedQuery,
				]);
			}
		},
	);
}
