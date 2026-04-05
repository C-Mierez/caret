import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { optimisticRenameFileCache } from "./optimistic-update-cache";

export default function useFilesRename() {
	return useMutation(api.files.rename).withOptimisticUpdate(
		(localStore, args) => {
			optimisticRenameFileCache(
				localStore,
				args.fileId,
				args.newName,
				Date.now(),
			);
		},
	);
}
