import { v } from "convex/values";
import createHttpError from "http-errors";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { verifyAuth } from "../lib/auth";
import { updateProjectTimestamp } from "../lib/utils";

/* --------------------------------- Queries -------------------------------- */

export const getProjectFiles = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const files = await ctx.db
			.query("files")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		return files;
	},
});

export const getOwnedSorted = query({
	args: {
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
	},
	handler: async (
		ctx,
		args: {
			projectId: Id<"projects">;
			parentId: Id<"files"> | undefined;
		},
	) => {
		await verifyAuth(ctx);

		const files = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", args.projectId).eq("parentId", args.parentId),
			)
			.collect();

		// Sort folders first, then files, both alphabetically by name
		return files.sort((a, b) => {
			if (a.type === "folder" && b.type === "file") return -1;
			if (a.type === "file" && b.type === "folder") return 1;

			return a.name.localeCompare(b.name);
		});
	},
});

export const getFileById = query({
	args: {
		fileId: v.id("files"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const file = await ctx.db.get("files", args.fileId);

		if (!file) {
			throw new createHttpError.NotFound("File not found");
		}

		return file;
	},
});

export const getFilesWithUrls = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const files = await ctx.db
			.query("files")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		return await Promise.all(
			files.map(async (file) => {
				if (file.storageId) {
					const storageUrl = await ctx.storage.getUrl(file.storageId);
					return { ...file, storageUrl };
				}
				return { ...file, storageUrl: null };
			}),
		);
	},
});

/* -------------------------------- Mutations ------------------------------- */

export const updateFileContent = mutation({
	args: {
		fileId: v.id("files"),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const file = await ctx.db.get("files", args.fileId);

		if (!file) {
			throw new createHttpError.NotFound("File not found");
		}

		if (file.type !== "file")
			throw new createHttpError.BadRequest("Only files can have content");

		const now = Date.now();

		await ctx.db.patch(args.fileId, {
			content: args.content,
			updatedAt: now,
		});

		await updateProjectTimestamp(ctx, file.projectId, now);
	},
});

export const createFile = mutation({
	args: {
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
		name: v.string(),
		type: v.literal("file"),
		content: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		// Verify no file with same name exists in this folder
		const existingFiles = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", args.projectId).eq("parentId", args.parentId),
			)
			.collect();

		if (existingFiles.some((file) => file.name === args.name)) {
			throw new createHttpError.Conflict(
				`A file named "${args.name}" already exists in this folder.`,
			);
		}

		const now = Date.now();

		const fileId = await ctx.db.insert("files", {
			projectId: args.projectId,
			parentId: args.parentId,
			name: args.name,
			type: "file",
			content: args.content,
			updatedAt: now,
		});

		await updateProjectTimestamp(ctx, args.projectId, now);

		return fileId;
	},
});

// Batch create files (all must be in the same parent folder)
export const createFiles = mutation({
	args: {
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
		files: v.array(
			v.object({
				name: v.string(),
				content: v.optional(v.string()),
			}),
		),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		// Verify no file repeats in the same folder (type-specific)
		const existingFiles = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", args.projectId).eq("parentId", args.parentId),
			)
			.collect();

		for (const file of args.files) {
			if (
				existingFiles.some(
					(f) => f.name === file.name && f.type === "file",
				)
			) {
				throw new createHttpError.Conflict(
					`A file named "${file.name}" already exists in this folder.`,
				);
			}
		}

		// Reject duplicate names inside the request itself
		const seenNames = new Set<string>();
		for (const file of args.files) {
			if (seenNames.has(file.name)) {
				throw new createHttpError.Conflict(
					`Duplicate file name "${file.name}" in request.`,
				);
			}
			seenNames.add(file.name);
		}

		const now = Date.now();

		// Insert all files in parallel to improve throughput
		const insertPromises = args.files.map((file) =>
			ctx.db.insert("files", {
				projectId: args.projectId,
				parentId: args.parentId,
				name: file.name,
				type: "file",
				content: file.content,
				updatedAt: now,
			}),
		);

		const fileIds = await Promise.all(insertPromises);

		await updateProjectTimestamp(ctx, args.projectId, now);

		return fileIds;
	},
});

export const createFolder = mutation({
	args: {
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
		name: v.string(),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		// Verify no sibling repeats in the same folder
		const existingFiles = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", args.projectId).eq("parentId", args.parentId),
			)
			.collect();

		if (existingFiles.some((file) => file.name === args.name)) {
			throw new createHttpError.Conflict(
				`A file named "${args.name}" already exists in this folder.`,
			);
		}

		const now = Date.now();

		const folderId = await ctx.db.insert("files", {
			projectId: args.projectId,
			parentId: args.parentId,
			name: args.name,
			type: "folder",
			updatedAt: now,
		});

		await updateProjectTimestamp(ctx, args.projectId, now);

		return folderId;
	},
});

export const deleteFile = mutation({
	args: {
		fileId: v.id("files"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const file = await ctx.db.get("files", args.fileId);

		if (!file) {
			throw new createHttpError.NotFound("File not found");
		}

		// Recursive delete for folders and their children
		const deleteFileAndChildren = async (fileId: Id<"files">) => {
			const currentFile = await ctx.db.get(fileId);
			if (!currentFile) return;

			const children = await ctx.db
				.query("files")
				.withIndex("by_parent", (q) => q.eq("parentId", fileId))
				.collect();

			await Promise.all(
				children.map((child) => deleteFileAndChildren(child._id)),
			);

			if (currentFile.storageId) {
				try {
					await ctx.storage.delete(currentFile.storageId);
				} catch (_e) {
					// ignore storage delete errors but don't stop DB cleanup
				}
			}

			await ctx.db.delete(fileId);
		};

		await deleteFileAndChildren(args.fileId);

		await updateProjectTimestamp(ctx, file.projectId, Date.now());
	},
});

export const renameFile = mutation({
	args: {
		fileId: v.id("files"),
		newName: v.string(),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const file = await ctx.db.get("files", args.fileId);

		if (!file) {
			throw new createHttpError.NotFound("File not found");
		}

		// Verify no file repeats in the same folder
		const existingFiles = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", file.projectId).eq("parentId", file.parentId),
			)
			.collect();

		if (
			existingFiles.some(
				(f) => f.name === args.newName && f._id !== args.fileId,
			)
		) {
			throw new createHttpError.Conflict(
				`A file named "${args.newName}" already exists in this folder.`,
			);
		}

		const now = Date.now();

		await ctx.db.patch(args.fileId, {
			name: args.newName,
			updatedAt: now,
		});

		await updateProjectTimestamp(ctx, file.projectId, now);
	},
});

export const removeAllFilesFromProject = mutation({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const files = await ctx.db
			.query("files")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();

		await Promise.all(
			files.map((file) => {
				if (file.storageId) {
					ctx.storage.delete(file.storageId).catch(() => {
						// ignore storage delete errors but don't stop DB cleanup
					});
				}

				return ctx.db.delete(file._id);
			}),
		);

		return { deletedCount: files.length };
	},
});

export const generateUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await verifyAuth(ctx);

		return await ctx.storage.generateUploadUrl();
	},
});

export const createBinaryFile = mutation({
	args: {
		projectId: v.id("projects"),
		name: v.string(),
		storageId: v.id("_storage"),
		parentId: v.optional(v.id("files")),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const files = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", args.projectId).eq("parentId", args.parentId),
			)
			.collect();

		if (files.some((file) => file.name === args.name)) {
			throw new createHttpError.Conflict(
				`A file named "${args.name}" already exists in this folder.`,
			);
		}

		const now = Date.now();

		const fileId = await ctx.db.insert("files", {
			projectId: args.projectId,
			parentId: args.parentId,
			name: args.name,
			type: "file",
			storageId: args.storageId,
			updatedAt: now,
		});

		return fileId;
	},
});
