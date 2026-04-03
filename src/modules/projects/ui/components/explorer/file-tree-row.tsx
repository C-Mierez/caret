import TogglableChevron from "@components/togglable-chevron";
import type { Doc } from "@convex/_generated/dataModel";
import { cn } from "@lib/utils";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { useFileTreeContext } from "./file-tree-context";
import { getFilePadding } from "./utils";

interface Props {
	file: Pick<Doc<"files">, "_id" | "name" | "type" | "parentId">;
	depth: number;
}

export default function FileTreeRow({ file, depth }: Props) {
	const { activeEntryId, expandedIds, onEntryClick } = useFileTreeContext();
	const isActive = activeEntryId === file._id;

	return (
		<button
			type="button"
			onClick={() => onEntryClick(file)}
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
				<TogglableChevron isOpen={expandedIds.includes(file._id)} />
			)}

			{file.type === "folder" ? (
				<FolderIcon folderName={file.name} className="size-4" />
			) : (
				<FileIcon fileName={file.name} autoAssign className="size-4" />
			)}
			<span
				className={cn(
					file.type === "file" ? "leading-3" : "leading-3.5",
				)}
			>
				{file.name}
			</span>
		</button>
	);
}
