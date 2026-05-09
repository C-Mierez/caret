import { eventType } from "inngest";
import { z } from "zod";
import { InngestEvent } from "@/inngest/events";

const GithubImportSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	githubToken: z.string(),
	projectId: z.string(),
});

const GithubImportCancelledSchema = z.object({
	owner: z.string(),
	repo: z.string(),
	projectId: z.string(),
});

const GithubExportSchema = z.object({
	projectId: z.string(),
	owner: z.string(),
	repo: z.string(),
	githubToken: z.string(),
	description: z.string().optional(),
	visibility: z.enum(["private", "public"]).optional(),
});

const GithubExportCancelledSchema = z.object({
	projectId: z.string(),
});

export const GithubImportEvent = eventType(InngestEvent.GithubImport, {
	schema: GithubImportSchema,
});

export const GithubImportCancelledEvent = eventType(
	InngestEvent.GithubImportCancelled,
	{
		schema: GithubImportCancelledSchema,
	},
);

export const GithubExportEvent = eventType(InngestEvent.GithubExport, {
	schema: GithubExportSchema,
});

export const GithubExportCancelledEvent = eventType(
	InngestEvent.GithubExportCancelled,
	{
		schema: GithubExportCancelledSchema,
	},
);
