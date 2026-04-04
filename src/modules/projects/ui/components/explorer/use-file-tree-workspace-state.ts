import type { Id } from "@convex/_generated/dataModel";
import useModal, { type ModalProps } from "@hooks/use-modal";
import useRequestConsumer from "@hooks/use-request-consumer";
import useFilesRemove from "@modules/projects/hooks/use-files-remove";
import type {
	FileActionTarget,
	FileCreateInputType,
} from "@modules/projects/stores/file-workspace.types";
import { useFileWorkspaceStore } from "@modules/projects/stores/use-file-workspace-store";
import { useState } from "react";

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
	const createInputRequest = useFileWorkspaceStore(
		(state) => state.createInputRequest,
	);
	const renameRequest = useFileWorkspaceStore((state) => state.renameRequest);
	const deleteRequest = useFileWorkspaceStore((state) => state.deleteRequest);

	const removeFile = useFilesRemove();

	const [deleteTargetFile, setDeleteTargetFile] =
		useState<FileActionTarget>();

	const deleteConfirmationModal = useModal({
		onClose: () => {
			setDeleteTargetFile(undefined);
		},
	});

	useRequestConsumer(createInputRequest, (request) => {
		openCreateInput({
			inputType: request.inputType,
			parentId: request.parentId,
		});
	});

	useRequestConsumer(renameRequest, (request) => {
		openRenameInput(request.fileId);
	});

	useRequestConsumer(deleteRequest, (request) => {
		setDeleteTargetFile(request.file);
		deleteConfirmationModal.openModal();
	});

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
