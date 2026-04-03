"use client";

import SimpleTooltip from "@components/simple-tooltip";
import TogglableChevron from "@components/togglable-chevron";
import type { Doc } from "@convex/_generated/dataModel";
import useToggle from "@hooks/use-toggle";
import { CopyMinusIcon, FilePlusIcon, FolderPlusIcon } from "lucide-react";
import { useState } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import FileTreeRoot from "./file-tree";

export default function FileExplorer() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	const { isOpen: isFileTreeOpen, toggle: toggleFileTree } = useToggle(true);
	const { isOpen: isFileInputOpen, setIsOpen: setIsFileInputOpen } =
		useToggle(false);
	const [fileInputType, setFileInputType] =
		useState<Doc<"files">["type"]>("file");

	/**
	 * I decided to use a "version" number to trigger file input opening to guarantee that the useEffect notices the change even if the user clicks multiple times in the same state.
	 * The consumer component handles this change to calc where the input should open, and expand the path towards it.
	 */
	const [newEntryRequestVersion, setNewEntryRequestVersion] = useState(0);
	// Likewise here
	const [newCollapseRequestVersion, setNewCollapseRequestVersion] =
		useState(0);

	const openInput = (type: Doc<"files">["type"]) => {
		setFileInputType(type);
		setNewEntryRequestVersion((prev) => prev + 1);
		setIsFileInputOpen(true);
	};

	const closeFileInput = () => setIsFileInputOpen(false);

	const handleNewFile = () => {
		openInput("file");
	};

	const handleNewFolder = () => {
		openInput("folder");
	};

	const handleCollapseFolders = () => {
		setNewCollapseRequestVersion((prev) => prev + 1);
	};

	return (
		<section className="flex size-full flex-col bg-muted-alt text-xs">
			<header className="group relative max-w-full border-b-2 bg-muted">
				<button
					type="button"
					onClick={toggleFileTree}
					className="flex w-full max-w-full items-center gap-2 truncate p-2 uppercase"
				>
					<TogglableChevron isOpen={isFileTreeOpen} />
					<span>{project.name}</span>
				</button>

				<menu
					role="toolbar"
					className="absolute top-0 right-0 bottom-0 hidden items-center text-muted-foreground group-hover:flex"
				>
					<SimpleTooltip
						label={{
							text: "New File...",
						}}
						onClick={handleNewFile}
					>
						<div className="py-2 pr-1 pl-2 hover:text-foreground">
							<FilePlusIcon className="size-3.5" />
						</div>
					</SimpleTooltip>

					<SimpleTooltip
						label={{
							text: "New Folder...",
						}}
						onClick={handleNewFolder}
					>
						<div className="py-2 pr-1 pl-1 hover:text-foreground">
							<FolderPlusIcon className="size-3.5" />
						</div>
					</SimpleTooltip>

					<SimpleTooltip
						label={{
							text: "Collapse Folders",
						}}
						onClick={handleCollapseFolders}
					>
						<div className="py-2 pr-2 pl-1 hover:text-foreground">
							<CopyMinusIcon className="size-3.5" />
						</div>
					</SimpleTooltip>
				</menu>
			</header>

			{isFileTreeOpen && (
				<FileTreeRoot
					isFileInputOpen={isFileInputOpen}
					closeFileInput={closeFileInput}
					newEntryRequestVersion={newEntryRequestVersion}
					newCollapseRequestVersion={newCollapseRequestVersion}
					fileInputType={fileInputType}
				/>
			)}
		</section>
	);
}
