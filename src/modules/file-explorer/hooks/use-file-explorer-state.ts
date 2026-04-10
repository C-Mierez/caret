"use client";

import useToggle from "@hooks/use-toggle";
import { useFileExplorerRequest } from "@modules/file-explorer/stores/use-file-explorer-request";

export default function useFileExplorerState() {
	const { isOpen: isFileTreeOpen, toggle: toggleFileTree } = useToggle(true);
	const requestCollapseAll = useFileExplorerRequest(
		(state) => state.requestCollapseAll,
	);

	const requestClearSelection = useFileExplorerRequest(
		(state) => state.requestClearSelection,
	);

	return {
		isFileTreeOpen,
		toggleFileTree,
		requestCollapseAll,
		requestClearSelection,
	};
}
