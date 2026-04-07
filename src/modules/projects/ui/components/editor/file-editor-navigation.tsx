"use client";

import { ScrollArea, ScrollBar } from "@components/ui/scroll-area";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { cn } from "@lib/utils";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useQuery } from "convex/react";
import { XIcon } from "lucide-react";
import FileContextMenu from "../file-actions/file-context-menu";
import useFileEditorNavigationState from "./use-file-editor-navigation-state";

export default function FileEditorNavigation() {
	const {
		openFiles,
		activeFileId,
		previewFileId,
		onEntryClick,
		onEntryDoubleClick,
		onCloseFile,
	} = useFileEditorNavigationState();

	return (
		<ScrollArea className="group/scroll-area">
			<ul className="flex h-tabs">
				{openFiles.map((fileId) => {
					return (
						<FileEditorTab
							key={fileId}
							fileId={fileId}
							isActive={fileId === activeFileId}
							isPreview={fileId === previewFileId}
							onEntryClick={onEntryClick}
							onEntryDoubleClick={onEntryDoubleClick}
							onCloseFile={onCloseFile}
						/>
					);
				})}
				{previewFileId && (
					<FileEditorTab
						fileId={previewFileId}
						isActive={previewFileId === activeFileId}
						isPreview={true}
						onEntryClick={onEntryClick}
						onEntryDoubleClick={onEntryDoubleClick}
						onCloseFile={onCloseFile}
					/>
				)}
			</ul>
			<ScrollBar
				orientation="horizontal"
				className="invisible group-hover/scroll-area:visible"
			/>
		</ScrollArea>
	);
}

interface FileEditorTabProps {
	fileId: Id<"files">;
	isActive: boolean;
	isPreview: boolean;
	onEntryClick: (file: Doc<"files">) => void;
	onEntryDoubleClick: (file: Doc<"files">) => void;
	onCloseFile: (fileId: Id<"files">) => void;
}

function FileEditorTab({
	fileId,
	isActive,
	isPreview,
	onEntryClick,
	onEntryDoubleClick,
	onCloseFile,
}: FileEditorTabProps) {
	const file = useQuery(api.files.getOwnedById, {
		fileId,
	});

	if (!file) return null;

	return (
		<li
			className={cn(
				"group flex h-full items-center gap-2 border-r-2 bg-muted-alt pr-2 pl-4 text-sm",
				isActive && "bg-muted",
				!isActive && "text-muted-foreground hover:bg-muted",
				isPreview && "italic",
			)}
		>
			<FileContextMenu file={file}>
				<button
					type="button"
					onClick={() => onEntryClick(file)}
					onDoubleClick={() => onEntryDoubleClick(file)}
					className="flex h-full w-max items-center gap-1"
				>
					{file.type === "folder" ? (
						<FolderIcon
							folderName={file.name}
							className="size-4 shrink-0"
						/>
					) : (
						<FileIcon
							fileName={file.name}
							autoAssign
							className="size-4 shrink-0"
						/>
					)}
					{file.name}
				</button>
			</FileContextMenu>

			<button
				type="button"
				onClick={() => onCloseFile(file._id)}
				className="invisible text-muted-foreground hover:bg-muted hover:text-foreground group-hover:visible"
			>
				<XIcon className="size-4" />
			</button>
		</li>
	);
}
