import TogglableChevron from "@components/togglable-chevron";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { cn } from "@lib/utils";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useQuery } from "convex/react";
import React, { useEffect, useRef, useState } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import FileInput from "./file-input";
import { getFilePadding } from "./utils";

interface Props {
	isFileInputOpen: boolean;
	closeFileInput: () => void;
	newEntryRequestVersion: number;
	newCollapseRequestVersion: number;
	fileInputType: Doc<"files">["type"];
}

export default function FileTreeRoot({
	isFileInputOpen,
	closeFileInput,
	newEntryRequestVersion,
	newCollapseRequestVersion,
	fileInputType,
}: Props) {
	const [expandedIds, setExpandedIds] = useState<Id<"files">[]>([]);
	const [activeEntry, setActiveEntry] = useState<
		Pick<Doc<"files">, "_id" | "type" | "parentId"> | undefined
	>(undefined); // Cached relevant data instead of querying it
	const [inputParentId, setInputParentId] = useState<Id<"files"> | undefined>(
		undefined,
	);
	const handledNewEntryRequestVersionRef = useRef(0);
	const handledNewCollapseRequestVersionRef = useRef(0);
	const activeId = activeEntry?._id;

	const activePath = useQuery(
		api.files.getOwnedPathToRoot,
		activeId
			? {
					fileId: activeId,
				}
			: "skip",
	);

	// Handle newEntryRequestVersion changes to open the input in the right place and expand the path towards it
	useEffect(() => {
		if (!newEntryRequestVersion) return;

		if (handledNewEntryRequestVersionRef.current === newEntryRequestVersion)
			return;

		// Root by default if no active
		if (!activeEntry) {
			setInputParentId(undefined);
			handledNewEntryRequestVersionRef.current = newEntryRequestVersion;
			return;
		}

		if (!activePath) return;

		setInputParentId(
			activeEntry.type === "folder"
				? activeEntry._id
				: activeEntry.parentId,
		);
		setExpandedIds((prev) => [
			...new Set([...prev, ...activePath.folderPathIds]),
		]);

		handledNewEntryRequestVersionRef.current = newEntryRequestVersion;
	}, [newEntryRequestVersion, activeEntry, activePath]);

	// Handle newCollapseRequestVersion changes to collapse all folders
	useEffect(() => {
		if (!newCollapseRequestVersion) return;

		if (
			handledNewCollapseRequestVersionRef.current ===
			newCollapseRequestVersion
		)
			return;

		setExpandedIds([]);
	}, [newCollapseRequestVersion]);

	const onClick = (file: Doc<"files">) => {
		if (activeEntry?._id === file._id) {
			setActiveEntry(undefined);
		} else {
			setActiveEntry({
				_id: file._id,
				type: file.type,
				parentId: file.parentId,
			});
		}

		if (file.type === "folder") {
			setExpandedIds((prev) => {
				if (prev.includes(file._id)) {
					return prev.filter((expandedId) => expandedId !== file._id);
				}

				return [...prev, file._id];
			});
		}

		// TODO File click actions
	};

	return (
		<FileTreeNode
			isFileInputOpen={isFileInputOpen}
			closeFileInput={closeFileInput}
			fileInputType={fileInputType}
			inputParentId={inputParentId}
			expandedIds={expandedIds}
			activeId={activeId}
			onClick={onClick}
			path={[]}
			type={undefined}
			depth={0}
		/>
	);
}

interface FileTreeNodeProps {
	isFileInputOpen: boolean;
	closeFileInput: () => void;
	fileInputType: Doc<"files">["type"];
	inputParentId: Id<"files"> | undefined;
	expandedIds: Id<"files">[];
	activeId: Id<"files"> | undefined;
	onClick: (file: Doc<"files">) => void;
	path: Id<"files">[];
	type: Doc<"files">["type"] | undefined;
	depth: number;
}

function FileTreeNode({
	isFileInputOpen,
	closeFileInput,
	fileInputType,
	inputParentId,
	expandedIds,
	activeId,
	onClick,
	path,
	type,
	depth,
}: FileTreeNodeProps) {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const currentParentId = path[path.length - 1] as Id<"files"> | undefined;

	const data = useQuery(
		api.files.getOwnedSorted,
		expandedIds.includes(currentParentId as Id<"files">) ||
			currentParentId === undefined
			? {
					projectId: project._id,
					parentId: currentParentId,
				}
			: "skip",
	);

	if (!data) return null;

	return (
		<div className="flex flex-col">
			{isFileInputOpen &&
				(type === "folder" || type === undefined) &&
				inputParentId === currentParentId && (
					<FileInput
						closeFileInput={closeFileInput}
						parentId={currentParentId}
						type={fileInputType}
						depth={depth}
					/>
				)}

			{data.map((file) => {
				const isActive = activeId === file._id;

				return (
					<React.Fragment key={file._id}>
						<button
							type="button"
							onClick={() => onClick(file)}
							className={cn(
								"flex items-end gap-1 py-1 text-start",
								!isActive && "hover:bg-muted",
								isActive && "bg-muted",
							)}
							style={{
								paddingLeft: getFilePadding(depth, file.type),
							}}
						>
							{file.type === "folder" && (
								<TogglableChevron
									isOpen={expandedIds.includes(file._id)}
								/>
							)}

							{file.type === "folder" ? (
								<FolderIcon
									folderName={file.name}
									className="size-4"
								/>
							) : (
								<FileIcon
									fileName={file.name}
									autoAssign
									className="size-4"
								/>
							)}
							<span
								className={cn(
									file.type === "file"
										? "leading-3"
										: "leading-3.5",
								)}
							>
								{file.name}
							</span>
						</button>

						{file.type === "folder" && (
							<FileTreeNode
								isFileInputOpen={isFileInputOpen}
								closeFileInput={closeFileInput}
								fileInputType={fileInputType}
								inputParentId={inputParentId}
								expandedIds={expandedIds}
								activeId={activeId}
								onClick={onClick}
								path={[...path, file._id]}
								type={file.type}
								depth={depth + 1}
							/>
						)}
					</React.Fragment>
				);
			})}
		</div>
	);
}
