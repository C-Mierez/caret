import type { Doc } from "@convex/_generated/dataModel";

export const FILE_BASE_PADDING = 40;

export const FILE_INDENT_PADDING = 30;

export const FILE_GAP = 4; // equivalent to gap-1

export function getFilePadding(depth: number, type: Doc<"files">["type"]) {
	if (type === "folder") {
		return FILE_BASE_PADDING + depth * FILE_INDENT_PADDING;
	}
	return FILE_BASE_PADDING + (depth + 1) * FILE_INDENT_PADDING + FILE_GAP * 2;
}
