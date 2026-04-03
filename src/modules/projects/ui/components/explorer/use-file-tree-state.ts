import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { FileTreeCommand } from "./file-tree-command";

export type FileTreeActiveEntry = Pick<
	Doc<"files">,
	"_id" | "type" | "parentId"
>;

interface Options {
	treeCommand: FileTreeCommand | undefined;
}

export default function useFileTreeState({ treeCommand }: Options) {
	const [expandedIds, setExpandedIds] = useState<Id<"files">[]>([]);
	const [activeEntry, setActiveEntry] = useState<FileTreeActiveEntry>();
	const [isCreateInputOpen, setIsCreateInputOpen] = useState(false);
	const [createInputType, setCreateInputType] =
		useState<Doc<"files">["type"]>("file");
	const [inputParentId, setInputParentId] = useState<Id<"files">>();
	const handledCommandIdRef = useRef(0);
	const activeEntryId = activeEntry?._id;

	const activePath = useQuery(
		api.files.getOwnedPathToRoot,
		activeEntryId
			? {
					fileId: activeEntryId,
				}
			: "skip",
	);

	useEffect(() => {
		if (!treeCommand) return;

		if (handledCommandIdRef.current === treeCommand.id) return;

		switch (treeCommand.type) {
			case "collapse-all": {
				setExpandedIds([]);
				setIsCreateInputOpen(false);
				setInputParentId(undefined);
				handledCommandIdRef.current = treeCommand.id;
				return;
			}

			case "open-create-input": {
				setCreateInputType(treeCommand.inputType);
				setIsCreateInputOpen(true);

				if (!activeEntry) {
					setInputParentId(undefined);
					handledCommandIdRef.current = treeCommand.id;
					return;
				}

				if (!activePath) return;

				setInputParentId(
					activeEntry.type === "folder"
						? activeEntry._id
						: activeEntry.parentId,
				);
				setExpandedIds((prev) => [
					...new Set([...prev, ...activePath.folderPathIds]),
				]);
				handledCommandIdRef.current = treeCommand.id;
				return;
			}

			case "sync-selection-from-editor": {
				// Placeholder: actual selection syncing will be implemented when editor events are wired.
				handledCommandIdRef.current = treeCommand.id;
				return;
			}

			case "clear-selection": {
				setActiveEntry(undefined);
				handledCommandIdRef.current = treeCommand.id;
				return;
			}

			default: {
				return treeCommand satisfies never;
			}
		}
	}, [treeCommand, activeEntry, activePath]);

	const closeCreateInput = useCallback(() => {
		setIsCreateInputOpen(false);
		setInputParentId(undefined);
	}, []);

	const onEntryClick = useCallback(
		(file: FileTreeActiveEntry) => {
			if (activeEntry?._id === file._id) {
				setActiveEntry(undefined);
			} else {
				setActiveEntry(file);
			}

			if (file.type === "folder") {
				setExpandedIds((prev) => {
					if (prev.includes(file._id)) {
						return prev.filter(
							(expandedId) => expandedId !== file._id,
						);
					}

					return [...prev, file._id];
				});
			}
		},
		[activeEntry],
	);

	return {
		expandedIds,
		activeEntryId,
		isCreateInputOpen,
		createInputType,
		closeCreateInput,
		inputParentId,
		onEntryClick,
	};
}
