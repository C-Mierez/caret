"use client";

import type { Doc, Id } from "@convex/_generated/dataModel";
import { createContext, useContext } from "react";

/**
 * Shared context for the file tree recursion.
 * Exposes: project ID, input state/type, expansion state, active selection, and tree actions.
 * Prevents prop-drilling through nested file tree nodes.
 */
export interface FileTreeContextValue {
	projectId: Id<"projects">;
	isCreateInputOpen: boolean;
	closeCreateInput: () => void;
	createInputType: Doc<"files">["type"];
	inputParentId: Id<"files"> | undefined;
	expandedIds: Id<"files">[];
	activeEntryId: Id<"files"> | undefined;
	onEntryClick: (
		file: Pick<Doc<"files">, "_id" | "type" | "parentId">,
	) => void;
}

const FileTreeContext = createContext<FileTreeContextValue | undefined>(
	undefined,
);

export function FileTreeProvider({
	value,
	children,
}: {
	value: FileTreeContextValue;
	children: React.ReactNode;
}) {
	return (
		<FileTreeContext.Provider value={value}>
			{children}
		</FileTreeContext.Provider>
	);
}

/**
 * Access the file tree context.
 * Must be used within a FileTreeProvider.
 */
export function useFileTreeContext() {
	const context = useContext(FileTreeContext);

	if (!context) {
		throw new Error(
			"useFileTreeContext must be used within FileTreeProvider",
		);
	}

	return context;
}
