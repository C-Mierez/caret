import type { FileActionTarget } from "@modules/projects/stores/file-workspace.types";
import { useFileWorkspaceStore } from "@modules/projects/stores/use-file-workspace-store";
import type { FileContextMenuItem } from "./file-context-menu";

export type FileAction =
	| "open"
	| "rename"
	| "delete"
	| "duplicate"
	| "create-file"
	| "create-folder";

export function useFileActions(file: FileActionTarget) {
	const requestOpenFile = useFileWorkspaceStore(
		(state) => state.requestOpenFile,
	);
	const requestRenameInput = useFileWorkspaceStore(
		(state) => state.requestRenameInput,
	);
	const requestDeleteFile = useFileWorkspaceStore(
		(state) => state.requestDeleteFile,
	);
	const requestDuplicateFile = useFileWorkspaceStore(
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
