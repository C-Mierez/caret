"use client";

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from "@components/ui/context-menu";
import type { FileAction } from "./use-file-actions";

export interface FileContextMenuItem {
	key: FileAction;
	label: string;
	disabled?: boolean;
	onSelect: () => void;
}

interface Props {
	children: React.ReactNode;
	items: FileContextMenuItem[];
}

export default function FileContextMenu({ children, items }: Props) {
	return (
		<ContextMenu>
			<ContextMenuTrigger>{children}</ContextMenuTrigger>
			<ContextMenuContent>
				{items.map((item) => (
					<ContextMenuItem
						key={item.key}
						disabled={item.disabled}
						onClick={item.onSelect}
					>
						{item.label}
					</ContextMenuItem>
				))}
			</ContextMenuContent>
		</ContextMenu>
	);
}
