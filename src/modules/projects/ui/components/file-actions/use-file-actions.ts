import type { Doc } from "@convex/_generated/dataModel";
import { useFileWorkspaceStore } from "@modules/projects/stores/use-file-workspace-store";
import type { FileContextMenuItem } from "./file-context-menu";

export type FileAction = "open" | "rename" | "delete" | "duplicate";

interface Options {
	onOpen?: (fileId: Doc<"files">["_id"]) => void;
	onRename?: (fileId: Doc<"files">["_id"]) => void;
	onDelete?: (fileId: Doc<"files">["_id"]) => void;
	onDuplicate?: (fileId: Doc<"files">["_id"]) => void;
}

export function useFileActions(
	file: Pick<Doc<"files">, "_id" | "name" | "parentId" | "type">,
	options?: Options,
) {
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
	const onRename = options?.onRename ?? requestRenameInput;
	const onOpen = options?.onOpen ?? requestOpenFile;
	const onDelete = options?.onDelete ?? requestDeleteFile;
	const onDuplicate = options?.onDuplicate ?? requestDuplicateFile;

	return {
		items: [
			{ key: "open", label: "Open", onSelect: () => onOpen(file._id) },
			{
				key: "rename",
				label: "Rename",
				onSelect: () => onRename(file._id),
			},
			{
				key: "delete",
				label: "Delete",
				onSelect: () => onDelete(file._id),
			},
			{
				key: "duplicate",
				label: "Duplicate",
				onSelect: () => onDuplicate(file._id),
			},
		],
	} satisfies {
		items: FileContextMenuItem[];
	};
}
