"use client";

import { Input } from "@components/ui/input";
import type { Doc, Id } from "@convex/_generated/dataModel";
import useFilesCreateFile from "@modules/projects/hooks/use-files-createFile";
import useFilesCreateFolder from "@modules/projects/hooks/use-files-createFolder";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useRef, useState } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import { getFilePadding } from "./utils";

interface Props {
	closeFileInput: () => void;
	parentId: Id<"files"> | undefined;
	type: Doc<"files">["type"];
	depth: number;
}

export default function FileInput({
	closeFileInput,
	parentId,
	type,
	depth,
}: Props) {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const createFile = useFilesCreateFile();
	const createFolder = useFilesCreateFolder();
	const [value, setValue] = useState("");
	const isSubmittingRef = useRef(false);
	const isHandledRef = useRef(false);

	const handleSubmit = async () => {
		if (isSubmittingRef.current || isHandledRef.current) return;

		isHandledRef.current = true;

		const name = value.trim();
		closeFileInput();

		if (!name) return;

		isSubmittingRef.current = true;

		try {
			if (type === "folder") {
				await createFolder({
					name,
					projectId: project._id,
					parentId,
				});
				return;
			}

			await createFile({
				name,
				content: "",
				projectId: project._id,
				parentId,
			});
		} catch (error) {
			console.error("Failed to create explorer entry", error);
		}
	};

	const handleCancel = () => {
		if (isHandledRef.current) return;

		isHandledRef.current = true;
		closeFileInput();
	};

	return (
		<div
			className="flex h-6 items-center gap-1 hover:bg-muted"
			style={{
				paddingLeft: getFilePadding(depth, "file"),
			}}
		>
			{type === "folder" ? (
				<FolderIcon folderName={value} className="size-4" />
			) : (
				<FileIcon fileName={value} autoAssign className="size-4" />
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
				className="h-full pl-0 text-xs md:text-xs"
			/>
		</div>
	);
}
