import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import useRequestConsumer from "@hooks/use-request-consumer";
import { useFileEditorStore } from "@modules/file-editor/stores/use-file-editor-store";
import type { FileExplorerRequest } from "@modules/file-explorer/stores/file-explorer.types";
import type { FileCreateInputType } from "@modules/file-explorer/stores/file-workspace.types";
import { useFileExplorerRequest } from "@modules/file-explorer/stores/use-file-explorer-request";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useState } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

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
	const [syncTargetId, setSyncTargetId] = useState<Id<"files">>();
	const request = useFileExplorerRequest((state) => state.request);
	const activeEntryId = activeEntry?._id;

	const { preloadedResult: project } = useProjectsGetOwnedById();
	const projectId = project?._id;
	const editorOpenPreview = useFileEditorStore((state) => state.openPreview);
	const editorOpenFile = useFileEditorStore((state) => state.openFile);

	const activePath = useQuery(
		api.files.getOwnedPathToRoot,
		projectId && activeEntryId
			? {
					fileId: activeEntryId,
				}
			: "skip",
	);

	const syncTargetPath = useQuery(
		api.files.getOwnedPathToRoot,
		projectId && syncTargetId
			? {
					fileId: syncTargetId,
				}
			: "skip",
	);

	const expandPathToFile = useCallback(
		(
			fileId: Id<"files">,
			path: { folderPathIds: Id<"files">[] } | undefined,
		) => {
			const parentId =
				path?.folderPathIds[path.folderPathIds.length - 1] ?? undefined;

			setActiveEntry({
				_id: fileId,
				type: "file",
				parentId,
			});

			if (!path) return;

			setExpandedIds((prev) => [
				...new Set([...prev, ...path.folderPathIds]),
			]);
		},
		[],
	);

	/**
	 * Helper to add all folder IDs from a path to the expanded set.
	 */
	const addPathToExpandedIds = useCallback(
		(path: { folderPathIds: Id<"files">[] } | undefined) => {
			if (!path) return;

			setExpandedIds((prev) => [
				...new Set([...prev, ...path.folderPathIds]),
			]);
		},
		[],
	);

	useEffect(() => {
		if (!syncTargetId || !syncTargetPath) return;

		expandPathToFile(
			syncTargetId,
			// Transform {_id, name}[] to just {_id}[]
			{
				folderPathIds: syncTargetPath.folderPathIds.map(
					({ _id }) => _id,
				),
			},
		);
		setSyncTargetId(undefined);
	}, [syncTargetId, syncTargetPath, expandPathToFile]);

	const handleRequest = useCallback(
		(nextRequest: FileExplorerRequest) => {
			switch (nextRequest.type) {
				case "collapse-all": {
					setExpandedIds([]);
					setIsCreateInputOpen(false);
					setInputParentId(undefined);
					return;
				}

				case "sync-selection-from-editor": {
					const { entryId } = nextRequest;

					if (activeEntryId === entryId) return;

					setSyncTargetId(entryId);
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
		},
		[activeEntryId],
	);

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

			addPathToExpandedIds({
				folderPathIds: activePath.folderPathIds.map(({ _id }) => _id),
			});
		},
		[activeEntry, activePath, addPathToExpandedIds],
	);

	const closeRenameInput = useCallback(() => {
		setRenameInputId(undefined);
	}, []);

	const openRenameInput = useCallback((fileId: Id<"files">) => {
		setRenameInputId(fileId);
	}, []);

	const onEntryClick = useCallback(
		(file: FileTreeActiveEntry) => {
			if (!projectId) return;

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

			if (file.type === "file") {
				editorOpenPreview(projectId, file._id);
			}
		},
		[activeEntry, editorOpenPreview, projectId],
	);

	const onEntryDoubleClick = useCallback(
		(file: FileTreeActiveEntry) => {
			if (!projectId) return;

			if (file.type === "file") {
				editorOpenFile(projectId, file._id);
			}
		},
		[editorOpenFile, projectId],
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
		onEntryDoubleClick,
	};
}
