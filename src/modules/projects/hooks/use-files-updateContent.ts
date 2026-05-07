import { api } from "@convex/_generated/api";
import { useSaveState } from "@modules/file-editor/stores/use-save-state";
import { useMutation } from "convex/react";
import { useCallback } from "react";
import { optimisticUpdateFileContentCache } from "./optimistic-update-cache";

export default function useFilesUpdateContent() {
	const setSaving = useSaveState((state) => state.setSaving);
	const mutation = useMutation(api.files.updateContent).withOptimisticUpdate(
		(localStore, args) => {
			optimisticUpdateFileContentCache(
				localStore,
				args.fileId,
				args.content,
				Date.now(),
			);
		},
	);

	return useCallback(
		async (args: Parameters<typeof mutation>[0]) => {
			setSaving(true);
			try {
				return await mutation(args);
			} finally {
				setSaving(false);
			}
		},
		[mutation, setSaving],
	);
}
