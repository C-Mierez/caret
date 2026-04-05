import type { Doc, Id } from "@convex/_generated/dataModel";
import type { RequestWithId } from "@hooks/use-request-consumer";

export type FileActionTarget = Pick<
	Doc<"files">,
	"_id" | "name" | "parentId" | "type"
>;

export type FileCreateInputType = Doc<"files">["type"];

export interface FileOpenRequest extends RequestWithId {
	type: "open";
	fileId: Id<"files">;
}

export interface FileCreateInputRequest extends RequestWithId {
	type: "create-input";
	inputType: FileCreateInputType;
	parentId: Id<"files"> | undefined;
}

export interface FileRenameRequest extends RequestWithId {
	type: "rename";
	fileId: Id<"files">;
}

export interface FileDeleteRequest extends RequestWithId {
	type: "delete";
	file: FileActionTarget;
}

export interface FileDuplicateRequest extends RequestWithId {
	type: "duplicate";
	fileId: Id<"files">;
}

export type FileWorkspaceRequest =
	| FileOpenRequest
	| FileCreateInputRequest
	| FileRenameRequest
	| FileDeleteRequest
	| FileDuplicateRequest;
