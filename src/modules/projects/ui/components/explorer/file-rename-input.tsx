"use client";

import TogglableChevron from "@components/togglable-chevron";
import { Input } from "@components/ui/input";
import type { Id } from "@convex/_generated/dataModel";
import useFilesRename from "@modules/projects/hooks/use-files-rename";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useRef, useState } from "react";
import { useFileTreeContext } from "./file-tree-context";
import { getFilePadding } from "./utils";

interface Props {
	fileId: Id<"files">;
	currentName: string;
	type: "file" | "folder";
	depth: number;
}

export default function FileRenameInput({
	fileId,
	currentName,
	type,
	depth,
}: Props) {
	const { closeRenameInput } = useFileTreeContext();
	const rename = useFilesRename();
	const [value, setValue] = useState(currentName);
	const isSubmittingRef = useRef(false);
	const isHandledRef = useRef(false);

	const handleSubmit = async () => {
		if (isSubmittingRef.current || isHandledRef.current) return;

		isHandledRef.current = true;

		const name = value.trim();
		closeRenameInput();

		if (!name || name === currentName) return;

		isSubmittingRef.current = true;

		try {
			await rename({
				fileId,
				newName: name,
			});
		} catch (error) {
			console.error("Failed to rename file", error);
		}
	};

	const handleCancel = () => {
		if (isHandledRef.current) return;

		isHandledRef.current = true;
		closeRenameInput();
	};

	return (
		<div
			className="flex h-6 w-max min-w-full items-center gap-1 pr-2 hover:bg-muted"
			style={{
				paddingLeft: getFilePadding(depth, type),
			}}
		>
			{type === "folder" ? (
				<>
					<TogglableChevron isOpen={false} />
					<FolderIcon
						folderName={value}
						className="size-4 shrink-0"
					/>
				</>
			) : (
				<FileIcon
					fileName={value}
					autoAssign
					className="size-4 shrink-0"
				/>
			)}
			<Input
				autoFocus
				value={value}
				onChange={(e) => setValue(e.target.value)}
				onBlur={handleSubmit}
				onKeyDown={(e) => {
					if (e.key === "Enter") {
						e.preventDefault();
						void handleSubmit();
						return;
					}

					if (e.key === "Escape") {
						e.preventDefault();
						handleCancel();
					}
				}}
				className="h-full min-w-40 pl-0 text-xs md:text-xs"
				onFocus={(e) => {
					// Select all text except extension
					if (type === "file" && currentName.includes(".")) {
						const lastDot = currentName.lastIndexOf(".");
						e.target.setSelectionRange(0, lastDot);
					} else {
						e.target.select();
					}
				}}
			/>
		</div>
	);
}
