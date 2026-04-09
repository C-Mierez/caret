"use client";

import { ScrollArea, ScrollBar } from "@components/ui/scroll-area";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { cn } from "@lib/utils";
import useFileEditorNavigationState from "@modules/file-editor/hooks/use-file-editor-navigation-state";
import FileContextMenu from "@modules/file-explorer/ui/components/file-actions/file-context-menu";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useQuery } from "convex/react";
import { XIcon } from "lucide-react";
import { useEffect, useMemo } from "react";

export default function FileEditorNavigation() {
	const {
		project,
		openFiles,
		activeFileId,
		previewFileId,
		onEntryClick,
		onEntryDoubleClick,
		onCloseFile,
	} = useFileEditorNavigationState();

	const allFiles = useQuery(api.files.getOwnedAll, {
		projectId: project._id,
	});

	const filesById = useMemo(() => {
		if (!allFiles) return undefined;

		return new Map(allFiles.map((file) => [file._id, file]));
	}, [allFiles]);

	useEffect(() => {
		if (!filesById) return;

		for (const fileId of openFiles) {
			if (!filesById.has(fileId)) {
				onCloseFile(fileId);
			}
		}

		if (previewFileId && !filesById.has(previewFileId)) {
			onCloseFile(previewFileId);
		}
	}, [filesById, onCloseFile, openFiles, previewFileId]);

	return (
		<ScrollArea className="group/scroll-area">
			<ul className="flex h-tabs">
				{openFiles.map((fileId) => {
					const file = filesById?.get(fileId);

					return (
						<FileEditorTab
							key={fileId}
							file={file}
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
						file={filesById?.get(previewFileId)}
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
	file: Doc<"files"> | undefined;
	isActive: boolean;
	isPreview: boolean;
	onEntryClick: (file: Doc<"files">) => void;
	onEntryDoubleClick: (file: Doc<"files">) => void;
	onCloseFile: (fileId: Id<"files">) => void;
}

function FileEditorTab({
	file,
	isActive,
	isPreview,
	onEntryClick,
	onEntryDoubleClick,
	onCloseFile,
}: FileEditorTabProps) {
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
				aria-label={`Close ${file.name || "tab"}`}
				className="text-muted-foreground opacity-0 hover:bg-muted hover:text-foreground focus:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
			>
				<XIcon className="size-4" />
			</button>
		</li>
	);
}
