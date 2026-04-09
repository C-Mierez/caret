import type { FileActionTarget } from "@modules/file-explorer/stores/file-workspace.types";
import { useFileWorkspaceRequest } from "@modules/file-explorer/stores/use-file-workspace-request";

export type FileContextMenuActionKey =
	| "open"
	| "rename"
	| "delete"
	| "duplicate"
	| "create-file"
	| "create-folder";

export interface FileContextMenuItem {
	key: FileContextMenuActionKey;
	label: string;
	disabled?: boolean;
	onSelect: () => void;
}

export function useFileContextMenuItems(file: FileActionTarget) {
	const requestOpenFile = useFileWorkspaceRequest(
		(state) => state.requestOpenFile,
	);
	const requestRenameInput = useFileWorkspaceRequest(
		(state) => state.requestRenameInput,
	);
	const requestDeleteFile = useFileWorkspaceRequest(
		(state) => state.requestDeleteFile,
	);
	const requestDuplicateFile = useFileWorkspaceRequest(
		(state) => state.requestDuplicateFile,
	);

	return {
		items: [
			{
				key: "open",
				label: "Open",
				onSelect: () => {
					requestOpenFile(file._id);
				},
			},
			{
				key: "rename",
				label: "Rename",
				onSelect: () => {
					requestRenameInput(file._id);
				},
			},
			{
				key: "delete",
				label: "Delete",
				onSelect: () => {
					requestDeleteFile(file);
				},
			},
			{
				key: "duplicate",
				label: "Duplicate",
				onSelect: () => {
					requestDuplicateFile(file._id);
				},
			},
		],
	} satisfies {
		items: FileContextMenuItem[];
	};
}

export function useFolderContextMenuItems(folder: FileActionTarget) {
	const requestCreateInput = useFileWorkspaceRequest(
		(state) => state.requestCreateInput,
	);
	const { items: fileItems } = useFileContextMenuItems(folder);

	return {
		items: [
			{
				key: "create-file",
				label: "Create File",
				onSelect: () => requestCreateInput("file", folder._id),
			},
			{
				key: "create-folder",
				label: "Create Folder",
				onSelect: () => requestCreateInput("folder", folder._id),
			},
			...fileItems,
		],
	} satisfies {
		items: FileContextMenuItem[];
	};
}
