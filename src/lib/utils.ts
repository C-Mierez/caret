import type { Doc } from "@convex/_generated/dataModel";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function buildImportStatusText(status: Doc<"projects">["importStatus"]) {
	switch (status) {
		case "not_started":
			return "Import not started";
		case "importing":
			return "Import in progress";
		case "completed":
			return "Import completed";
		case "failed":
			return "Import failed";
		case "canceled":
			return "Import canceled";
		default:
			return "Unknown import status";
	}
}
