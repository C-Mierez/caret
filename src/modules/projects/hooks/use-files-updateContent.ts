import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";
import { optimisticUpdateFileContentCache } from "./optimistic-update-cache";

export default function useFilesUpdateContent() {
	return useMutation(api.files.updateContent).withOptimisticUpdate(
		(localStore, args) => {
			optimisticUpdateFileContentCache(
				localStore,
				args.fileId,
				args.content,
				Date.now(),
			);
		},
	);
}
