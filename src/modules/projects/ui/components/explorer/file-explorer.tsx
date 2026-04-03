"use client";

import SimpleTooltip from "@components/simple-tooltip";
import TogglableChevron from "@components/togglable-chevron";
import { CopyMinusIcon, FilePlusIcon, FolderPlusIcon } from "lucide-react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import FileTreeRoot from "./file-tree";
import useFileExplorerState from "./use-file-explorer-state";

export default function FileExplorer() {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const {
		isFileTreeOpen,
		toggleFileTree,
		treeCommand,
		openCreateInput,
		collapseAll,
		clearSelection,
	} = useFileExplorerState();

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
						onClick={() => openCreateInput("file")}
					>
						<div className="py-2 pr-1 pl-2 hover:text-foreground">
							<FilePlusIcon className="size-3.5" />
						</div>
					</SimpleTooltip>

					<SimpleTooltip
						label={{
							text: "New Folder...",
						}}
						onClick={() => openCreateInput("folder")}
					>
						<div className="py-2 pr-1 pl-1 hover:text-foreground">
							<FolderPlusIcon className="size-3.5" />
						</div>
					</SimpleTooltip>

					<SimpleTooltip
						label={{
							text: "Collapse Folders",
						}}
						onClick={collapseAll}
					>
						<div className="py-2 pr-2 pl-1 hover:text-foreground">
							<CopyMinusIcon className="size-3.5" />
						</div>
					</SimpleTooltip>
				</menu>
			</header>

			{isFileTreeOpen && (
				<FileTreeRoot
					treeCommand={treeCommand}
					onClearSelection={clearSelection}
				/>
			)}
		</section>
	);
}
