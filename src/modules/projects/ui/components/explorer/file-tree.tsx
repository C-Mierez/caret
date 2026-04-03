import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Fragment, useMemo } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import FileInput from "./file-input";
import type { FileTreeCommand } from "./file-tree-command";
import { FileTreeProvider, useFileTreeContext } from "./file-tree-context";
import FileTreeRow from "./file-tree-row";
import useFileTreeInteractions from "./use-file-tree-interactions";
import useFileTreeState from "./use-file-tree-state";

interface Props {
	treeCommand: FileTreeCommand | undefined;
	onClearSelection: () => void;
}

export default function FileTreeRoot({ treeCommand, onClearSelection }: Props) {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const {
		expandedIds,
		activeEntryId,
		isCreateInputOpen,
		createInputType,
		closeCreateInput,
		inputParentId,
		onEntryClick,
	} = useFileTreeState({
		treeCommand,
	});
	const { containerRef } = useFileTreeInteractions({
		activeEntryId,
		onClearSelection,
	});

	// Avoid potential rerenders of the entire tree
	const providerValue = useMemo(
		() => ({
			projectId: project._id,
			isCreateInputOpen,
			closeCreateInput,
			createInputType,
			inputParentId,
			expandedIds,
			activeEntryId,
			onEntryClick,
		}),
		[
			project._id,
			isCreateInputOpen,
			closeCreateInput,
			createInputType,
			inputParentId,
			expandedIds,
			activeEntryId,
			onEntryClick,
		],
	);

	return (
		<FileTreeProvider value={providerValue}>
			<div
				ref={containerRef}
				className="h-[calc(100dvh-var(--spacing-subheader))] overflow-x-auto overflow-y-auto"
			>
				<div className="w-max min-w-full">
					<FileTreeNode path={[]} type={undefined} depth={0} />
				</div>
			</div>
		</FileTreeProvider>
	);
}

interface FileTreeNodeProps {
	path: Id<"files">[];
	type: Doc<"files">["type"] | undefined;
	depth: number;
}

function FileTreeNode({ path, type, depth }: FileTreeNodeProps) {
	const { projectId, isCreateInputOpen, inputParentId, expandedIds } =
		useFileTreeContext();
	const currentParentId = path[path.length - 1] as Id<"files"> | undefined;
	const shouldQueryChildren =
		currentParentId === undefined || expandedIds.includes(currentParentId);

	const data = useQuery(
		api.files.getOwnedSorted,
		shouldQueryChildren
			? {
					projectId,
					parentId: currentParentId,
				}
			: "skip",
	);

	if (!data) return null;

	return (
		<div className="flex flex-col">
			{isCreateInputOpen &&
				(type === "folder" || type === undefined) &&
				inputParentId === currentParentId && (
					<FileInput parentId={currentParentId} depth={depth} />
				)}

			{data.map((file) => {
				return (
					<Fragment key={file._id}>
						<FileTreeRow file={file} depth={depth} />

						{file.type === "folder" && (
							<FileTreeNode
								path={[...path, file._id]}
								type={file.type}
								depth={depth + 1}
							/>
						)}
					</Fragment>
				);
			})}
		</div>
	);
}
