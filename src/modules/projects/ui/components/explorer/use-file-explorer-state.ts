"use client";

import type { Doc, Id } from "@convex/_generated/dataModel";
import useToggle from "@hooks/use-toggle";
import { useRef, useState } from "react";
import type { FileTreeCommand } from "./file-tree-command";

export default function useFileExplorerState() {
	const { isOpen: isFileTreeOpen, toggle: toggleFileTree } = useToggle(true);
	const nextCommandIdRef = useRef(0);
	const [treeCommand, setTreeCommand] = useState<FileTreeCommand | undefined>(
		undefined,
	);

	const getNextCommandId = () => {
		nextCommandIdRef.current += 1;
		return nextCommandIdRef.current;
	};

	const openCreateInput = (type: Doc<"files">["type"]) => {
		const nextId = getNextCommandId();
		setTreeCommand({
			id: nextId,
			type: "open-create-input",
			inputType: type,
		});
	};

	const collapseAll = () => {
		const nextId = getNextCommandId();
		setTreeCommand({
			id: nextId,
			type: "collapse-all",
		});
	};

	const syncSelectionFromEditor = (entryId: Id<"files">) => {
		const nextId = getNextCommandId();
		setTreeCommand({
			id: nextId,
			type: "sync-selection-from-editor",
			entryId,
		});
	};

	const clearSelection = () => {
		const nextId = getNextCommandId();
		setTreeCommand({
			id: nextId,
			type: "clear-selection",
		});
	};

	return {
		isFileTreeOpen,
		treeCommand,
		toggleFileTree,
		openCreateInput,
		collapseAll,
		syncSelectionFromEditor,
		clearSelection,
	};
}
