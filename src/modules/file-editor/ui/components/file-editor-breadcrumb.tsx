"use client";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@components/ui/breadcrumb";
import useFileEditorBreadcrumbState from "@modules/file-editor/hooks/use-file-editor-breadcrumb-state";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { Loader2Icon } from "lucide-react";
import React from "react";

export default function FileEditorBreadcrumb() {
	const { openFiles, previewFileId, activeFileId, activePath, activeFile } =
		useFileEditorBreadcrumbState();

	if (!openFiles || (openFiles.length === 0 && !previewFileId)) {
		return null;
	}

	return (
		<div className="h-7 w-full bg-muted px-2 py-1">
			<Breadcrumb className="flex h-full items-center">
				<BreadcrumbList className="text-xs">
					{activeFileId &&
						activePath?.folderPathIds.map((folder) => (
							<React.Fragment key={folder._id}>
								<BreadcrumbItem>
									<BreadcrumbLink className="cursor-default">
										{folder.name}
									</BreadcrumbLink>
								</BreadcrumbItem>
								<BreadcrumbSeparator />
							</React.Fragment>
						))}
					{!!activeFile && (
						<BreadcrumbItem>
							<BreadcrumbPage className="flex items-center gap-1">
								{activeFile?.type === "folder" ? (
									<FolderIcon
										folderName={activeFile?.name || ""}
										className="size-3 shrink-0"
									/>
								) : (
									<FileIcon
										fileName={activeFile?.name || ""}
										autoAssign
										className="size-3 shrink-0"
									/>
								)}
								{activeFile?.name}
							</BreadcrumbPage>
						</BreadcrumbItem>
					)}
					{!activeFile && (
						<Loader2Icon className="size-3 animate-spin" />
					)}
				</BreadcrumbList>
			</Breadcrumb>
		</div>
	);
}
