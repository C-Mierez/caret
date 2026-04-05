import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import useRequestConsumer from "@hooks/use-request-consumer";
import type { FileExplorerRequest } from "@modules/projects/stores/file-explorer.types";
import type { FileCreateInputType } from "@modules/projects/stores/file-workspace.types";
import { useFileExplorerRequest } from "@modules/projects/stores/use-file-explorer-request";
import { useQuery } from "convex/react";
import { useCallback, useState } from "react";

export type FileTreeActiveEntry = Pick<
	Doc<"files">,
	"_id" | "type" | "parentId"
>;

interface OpenCreateInputOptions {
	inputType: FileCreateInputType;
	parentId?: Id<"files">;
}

export default function useFileTreeState() {
	const [expandedIds, setExpandedIds] = useState<Id<"files">[]>([]);
	const [activeEntry, setActiveEntry] = useState<FileTreeActiveEntry>();
	const [isCreateInputOpen, setIsCreateInputOpen] = useState(false);
	const [createInputType, setCreateInputType] =
		useState<Doc<"files">["type"]>("file");
	const [inputParentId, setInputParentId] = useState<Id<"files">>();
	const [renameInputId, setRenameInputId] = useState<Id<"files">>();
	const request = useFileExplorerRequest((state) => state.request);
	const activeEntryId = activeEntry?._id;

	const activePath = useQuery(
		api.files.getOwnedPathToRoot,
		activeEntryId
			? {
					fileId: activeEntryId,
				}
			: "skip",
	);

	const handleRequest = useCallback((nextRequest: FileExplorerRequest) => {
		switch (nextRequest.type) {
			case "collapse-all": {
				setExpandedIds([]);
				setIsCreateInputOpen(false);
				setInputParentId(undefined);
				return;
			}

			case "sync-selection-from-editor": {
				// Placeholder: actual selection syncing will be implemented when editor events are wired.
				return;
			}

			case "clear-selection": {
				setActiveEntry(undefined);
				return;
			}

			default: {
				return nextRequest satisfies never;
			}
		}
	}, []);

	useRequestConsumer(request, handleRequest);

	const closeCreateInput = useCallback(() => {
		setIsCreateInputOpen(false);
		setInputParentId(undefined);
	}, []);

	const openCreateInput = useCallback(
		({ inputType, parentId }: OpenCreateInputOptions) => {
			setCreateInputType(inputType);
			setIsCreateInputOpen(true);

			if (parentId) {
				setInputParentId(parentId);
				setExpandedIds((prev) =>
					prev.includes(parentId) ? prev : [...prev, parentId],
				);
				return;
			}

			if (!activeEntry) {
				setInputParentId(undefined);
				return;
			}

			const resolvedParentId =
				activeEntry.type === "folder"
					? activeEntry._id
					: activeEntry.parentId;

			setInputParentId(resolvedParentId);

			if (!activePath) {
				if (resolvedParentId) {
					setExpandedIds((prev) =>
						prev.includes(resolvedParentId)
							? prev
							: [...prev, resolvedParentId],
					);
				}
				return;
			}

			setExpandedIds((prev) => [
				...new Set([...prev, ...activePath.folderPathIds]),
			]);
		},
		[activeEntry, activePath],
	);

	const closeRenameInput = useCallback(() => {
		setRenameInputId(undefined);
	}, []);

	const openRenameInput = useCallback((fileId: Id<"files">) => {
		setRenameInputId(fileId);
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
		openCreateInput,
		closeCreateInput,
		inputParentId,
		renameInputId,
		closeRenameInput,
		openRenameInput,
		onEntryClick,
	};
}
