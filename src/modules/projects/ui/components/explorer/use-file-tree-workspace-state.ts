import type { Id } from "@convex/_generated/dataModel";
import useModal, { type ModalProps } from "@hooks/use-modal";
import useRequestConsumer from "@hooks/use-request-consumer";
import useFilesRemove from "@modules/projects/hooks/use-files-remove";
import type {
	FileActionTarget,
	FileCreateInputType,
	FileWorkspaceRequest,
} from "@modules/projects/stores/file-workspace.types";
import { useFileWorkspaceStore } from "@modules/projects/stores/use-file-workspace-store";
import { useCallback, useState } from "react";

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
	const request = useFileWorkspaceStore((state) => state.request);

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
