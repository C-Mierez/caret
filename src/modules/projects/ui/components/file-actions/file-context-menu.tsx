"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@components/ui/context-menu";
import type { FileActionTarget } from "@modules/projects/stores/file-workspace.types";
import { type FileAction, useFileActions } from "./use-file-actions";

export interface FileContextMenuItem {
	key: FileAction;
	label: string;
	disabled?: boolean;
	onSelect: () => void;
}

interface Props {
	children: React.ReactNode;
	file: FileActionTarget;
}

export default function FileContextMenu({ children, file }: Props) {
	const { items } = useFileActions(file);

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
