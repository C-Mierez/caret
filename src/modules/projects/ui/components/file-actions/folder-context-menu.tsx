"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@components/ui/context-menu";
import type { FileActionTarget } from "@modules/projects/stores/file-workspace.types";
import { useFolderContextMenuItems } from "./use-file-context-menu-items";

interface Props {
	children: React.ReactNode;
	file: FileActionTarget;
}

export default function FolderContextMenu({ children, file }: Props) {
	const { items } = useFolderContextMenuItems(file);

	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{items.map((item) => (
					<ContextMenuItem key={item.key} onClick={item.onSelect}>
						{item.label}
					</ContextMenuItem>
				))}
			</ContextMenuContent>
		</ContextMenu>
	);
}
