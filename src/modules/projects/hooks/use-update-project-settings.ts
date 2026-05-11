"use client";

import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { optimisticUpdateProjectSettingsCache } from "./optimistic-update-cache";

export default function useUpdateProjectSettings() {
	return useMutation(api.user.projects.updateSettings).withOptimisticUpdate(
		(localStore, args) => {
			optimisticUpdateProjectSettingsCache(
				localStore,
				args.projectId,
				args.settings,
				Date.now(),
			);
		},
	);
}
