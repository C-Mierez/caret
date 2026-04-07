import ConfirmationModal from "@components/modals/confirmation-modal";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { Fragment, useMemo } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import FileInput from "./file-input";
import FileRenameInput from "./file-rename-input";
import { FileTreeProvider, useFileTreeContext } from "./file-tree-context";
import FileTreeRow from "./file-tree-row";
import useFileTreeInteractions from "./use-file-tree-interactions";
import useFileTreeState from "./use-file-tree-state";
import useFileTreeWorkspaceState from "./use-file-tree-workspace-state";

interface Props {
	requestClearSelection: () => void;
}

export default function FileTreeRoot({ requestClearSelection }: Props) {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const {
		expandedIds,
		activeEntryId,
		isCreateInputOpen,
		createInputType,
		openCreateInput,
		closeCreateInput,
		inputParentId,
		renameInputId,
		closeRenameInput,
		openRenameInput,
		onEntryClick,
		onEntryDoubleClick,
	} = useFileTreeState();
	const { containerRef } = useFileTreeInteractions({
		activeEntryId,
		requestClearSelection,
	});

	const deleteConfirmationModal = useFileTreeWorkspaceState({
		openCreateInput,
		openRenameInput,
	});

	// Avoid potential rerenders of the entire tree
	const providerValue = useMemo(
		() => ({
			projectId: project._id,
			isCreateInputOpen,
			closeCreateInput,
			createInputType,
			inputParentId,
			renameInputId,
			closeRenameInput,
			openRenameInput,
			expandedIds,
			activeEntryId,
			onEntryClick,
			onEntryDoubleClick,
		}),
		[
			project._id,
			isCreateInputOpen,
			closeCreateInput,
			createInputType,
			inputParentId,
			renameInputId,
			closeRenameInput,
			openRenameInput,
			expandedIds,
			activeEntryId,
			onEntryClick,
			onEntryDoubleClick,
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

			<ConfirmationModal
				type="destructive"
				{...deleteConfirmationModal}
			/>
		</FileTreeProvider>
	);
}

interface FileTreeNodeProps {
	path: Id<"files">[];
	type: Doc<"files">["type"] | undefined;
	depth: number;
}

function FileTreeNode({ path, type, depth }: FileTreeNodeProps) {
	const {
		projectId,
		isCreateInputOpen,
		inputParentId,
		expandedIds,
		renameInputId,
	} = useFileTreeContext();
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
				const isRenaming = renameInputId === file._id;

				return (
					<Fragment key={file._id}>
						{isRenaming ? (
							<FileRenameInput
								fileId={file._id}
								currentName={file.name}
								type={file.type}
								depth={depth}
							/>
						) : (
							<FileTreeRow file={file} depth={depth} />
						)}

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
