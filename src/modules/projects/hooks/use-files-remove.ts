import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { optimisticRemoveFileCache } from "./optimistic-update-cache";

export default function useFilesRemove() {
	return useMutation(api.files.remove).withOptimisticUpdate(
		(localStore, args) => {
			optimisticRemoveFileCache(localStore, args.fileId);
		},
	);
}
