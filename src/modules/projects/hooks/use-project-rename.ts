import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

export default function useProjectRename() {
	return useMutation(api.projects.rename).withOptimisticUpdate(
		(localStore, args) => {
			const existingProject = localStore.getQuery(
				api.projects.getOwnedById,
				{
					projectId: args.projectId,
				},
			);

			if (existingProject !== undefined && existingProject !== null) {
				localStore.setQuery(
					api.projects.getOwnedById,
					{ projectId: args.projectId },
					{
						...existingProject,
						name: args.newName,
						updated_at: Date.now(),
					},
				);
			}

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

				const updatedPage = cachedQuery.value.page.map((project) => {
					if (project._id === args.projectId) {
						return {
							...project,
							name: args.newName,
							updated_at: Date.now(),
						};
					}
					return project;
				});

				localStore.setQuery(
					api.projects.getOwnedInfinite,
					cachedQuery.args,
					{
						...cachedQuery.value,
						page: updatedPage,
					},
				);
			}

			// Optimistic update for projects.getOwnedAll
			const cachedQuery = localStore.getQuery(
				api.projects.getOwnedAll,
				{},
			);
			if (cachedQuery !== undefined) {
				const updatedProjects = cachedQuery.map((project) => {
					if (project._id === args.projectId) {
						return {
							...project,
							name: args.newName,
							updated_at: Date.now(),
						};
					}
					return project;
				});

				localStore.setQuery(
					api.projects.getOwnedAll,
					{},
					updatedProjects,
				);
			}
		},
	);
}
