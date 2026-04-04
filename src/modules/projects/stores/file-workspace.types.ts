import type { Doc, Id } from "@convex/_generated/dataModel";
import type { RequestWithId } from "@hooks/use-request-consumer";

export type FileActionTarget = Pick<
	Doc<"files">,
	"_id" | "name" | "parentId" | "type"
>;

export type FileCreateInputType = Doc<"files">["type"];

export interface FileOpenRequest extends RequestWithId {
	fileId: Id<"files">;
}

export interface FileCreateInputRequest extends RequestWithId {
	inputType: FileCreateInputType;
	parentId: Id<"files"> | undefined;
}

export interface FileRenameRequest extends RequestWithId {
	fileId: Id<"files">;
}

export interface FileDeleteRequest extends RequestWithId {
	file: FileActionTarget;
}

export interface FileDuplicateRequest extends RequestWithId {
	fileId: Id<"files">;
}
