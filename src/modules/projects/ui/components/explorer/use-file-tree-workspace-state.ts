import type { Id } from "@convex/_generated/dataModel";
import { useFileWorkspaceStore } from "@modules/projects/stores/use-file-workspace-store";
import { useEffect, useRef } from "react";

interface Options {
	openRenameInput: (fileId: Id<"files">) => void;
}

export default function useFileTreeWorkspaceState({
	openRenameInput,
}: Options) {
	const renameRequest = useFileWorkspaceStore((state) => state.renameRequest);
	const handledRenameRequestIdRef = useRef(0);

	useEffect(() => {
		if (!renameRequest) return;

		if (renameRequest.id === handledRenameRequestIdRef.current) {
			return;
		}

		handledRenameRequestIdRef.current = renameRequest.id;
		openRenameInput(renameRequest.fileId);
	}, [renameRequest, openRenameInput]);
}
