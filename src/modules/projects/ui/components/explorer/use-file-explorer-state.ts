"use client";

import useToggle from "@hooks/use-toggle";
import { useFileExplorerStore } from "@modules/projects/stores/use-file-explorer-store";

export default function useFileExplorerState() {
	const { isOpen: isFileTreeOpen, toggle: toggleFileTree } = useToggle(true);
	const requestCollapseAll = useFileExplorerStore(
		(state) => state.requestCollapseAll,
	);
	const requestSyncSelection = useFileExplorerStore(
		(state) => state.requestSyncSelection,
	);
	const requestClearSelection = useFileExplorerStore(
		(state) => state.requestClearSelection,
	);

	return {
		isFileTreeOpen,
		toggleFileTree,
		requestCollapseAll,
		requestSyncSelection,
		requestClearSelection,
	};
}
