"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@components/ui/context-menu";
import type { FileActionTarget } from "@modules/projects/stores/file-workspace.types";
import { useFileWorkspaceStore } from "@modules/projects/stores/use-file-workspace-store";
import type { FileContextMenuItem } from "./file-context-menu";
import { useFileActions } from "./use-file-actions";

interface Props {
	children: React.ReactNode;
	file: FileActionTarget;
}

export default function FolderContextMenu({ children, file }: Props) {
	const requestCreateInput = useFileWorkspaceStore(
		(state) => state.requestCreateInput,
	);
	const { items } = useFileActions(file);
	const folderItems: FileContextMenuItem[] = [
		{
			key: "create-file",
			label: "Create File",
			onSelect: () => requestCreateInput("file", file._id),
		},
		{
			key: "create-folder",
			label: "Create Folder",
			onSelect: () => requestCreateInput("folder", file._id),
		},
		...items,
	];

	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{folderItems.map((item) => (
					<ContextMenuItem key={item.key} onClick={item.onSelect}>
						{item.label}
					</ContextMenuItem>
				))}
			</ContextMenuContent>
		</ContextMenu>
	);
}
