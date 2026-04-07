import type { Id } from "@convex/_generated/dataModel";
import useModal, { type ModalProps } from "@hooks/use-modal";
import useRequestConsumer from "@hooks/use-request-consumer";
import useFilesRemove from "@modules/projects/hooks/use-files-remove";
import type {
	FileActionTarget,
	FileCreateInputType,
	FileWorkspaceRequest,
} from "@modules/projects/stores/file-workspace.types";
import { useFileEditorStore } from "@modules/projects/stores/use-file-editor-store";
import { useFileExplorerRequest } from "@modules/projects/stores/use-file-explorer-request";
import { useFileWorkspaceRequest } from "@modules/projects/stores/use-file-workspace-request";
import { useCallback, useState } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

interface Options {
	openRenameInput: (fileId: Id<"files">) => void;
	openCreateInput: (options: {
		inputType: FileCreateInputType;
		parentId?: Id<"files">;
	}) => void;
}

interface FileTreeWorkspaceState extends ModalProps {
	title: string;
	message: string;
	onConfirm: () => void;
	onCancel: () => void;
}

export default function useFileTreeWorkspaceState({
	openRenameInput,
	openCreateInput,
}: Options): FileTreeWorkspaceState {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const request = useFileWorkspaceRequest((state) => state.request);
	const requestSyncSelection = useFileExplorerRequest(
		(state) => state.requestSyncSelection,
	);
	const requestClearSelection = useFileExplorerRequest(
		(state) => state.requestClearSelection,
	);
	const closeFile = useFileEditorStore((state) => state.closeFile);

	const removeFile = useFilesRemove();

	const [deleteTargetFile, setDeleteTargetFile] =
		useState<FileActionTarget>();

	const deleteConfirmationModal = useModal({
		onClose: () => {
			setDeleteTargetFile(undefined);
		},
	});

	const handleRequest = useCallback(
		(nextRequest: FileWorkspaceRequest) => {
			switch (nextRequest.type) {
				case "create-input": {
					openCreateInput({
						inputType: nextRequest.inputType,
						parentId: nextRequest.parentId,
					});
					return;
				}

				case "rename": {
					openRenameInput(nextRequest.fileId);
					return;
				}

				case "delete": {
					setDeleteTargetFile(nextRequest.file);
					deleteConfirmationModal.openModal();
					return;
				}

				case "open": {
					return;
				}

				case "duplicate": {
					return;
				}

				default: {
					return nextRequest satisfies never;
				}
			}
		},
		[deleteConfirmationModal, openCreateInput, openRenameInput],
	);

	useRequestConsumer(request, handleRequest);

	const deleteTargetLabel = deleteTargetFile?.type ?? "file";
	const deleteTargetName = deleteTargetFile?.name ?? "this item";

	return {
		title: `Delete ${deleteTargetLabel}`,
		message: `This will permanently delete "${deleteTargetName}" and cannot be undone.`,
		onConfirm: () => {
			if (!deleteTargetFile) return;

			if (deleteTargetFile.type === "file") {
				const nextActiveFileId = closeFile(
					project._id,
					deleteTargetFile._id,
				);

				if (nextActiveFileId) {
					requestSyncSelection(nextActiveFileId);
				} else {
					requestClearSelection();
				}
			}

			void removeFile({ fileId: deleteTargetFile._id }).catch((error) => {
				console.error("Failed to delete explorer entry", error);
			});
		},
		onCancel: () => {
			deleteConfirmationModal.closeModal();
		},
		...deleteConfirmationModal,
	};
}
