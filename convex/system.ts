import { v } from "convex/values";
import createHttpError from "http-errors";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./lib/auth";
import { updateProjectTimestamp } from "./lib/utils";

/* -------------------------------- Messages -------------------------------- */

export const getPendingMessages = query({
	args: {
		conversationId: v.id("conversations"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		return await ctx.db
			.query("messages")
			.withIndex("by_conversation_status", (q) =>
				q
					.eq("conversationId", args.conversationId)
					.eq("status", "pending"),
			)
			.collect();
	},
});

export const getRecentMessages = query({
	args: {
		conversationId: v.id("conversations"),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const messages = await ctx.db
			.query("messages")
			.withIndex("by_conversation", (q) =>
				q.eq("conversationId", args.conversationId),
			)
			.order("asc")
			.take(args.limit ?? 10);

		return messages;
	},
});

export const createMessage = mutation({
	args: {
		conversationId: v.id("conversations"),
		projectId: v.id("projects"),
		sender: v.union(v.literal("user"), v.literal("assistant")),
		content: v.string(),
		status: v.union(
			v.literal("pending"),
			v.literal("sent"),
			v.literal("failed"),
			v.literal("cancelled"),
		),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		// Fetch conversation and verify projectId consistency
		const conversation = await ctx.db.get(
			"conversations",
			args.conversationId,
		);

		if (!conversation) {
			throw new createHttpError.NotFound("Conversation not found");
		}

		if (conversation.projectId !== args.projectId) {
			throw new createHttpError.Unauthorized(
				"Project ID does not match conversation's project",
			);
		}

		const now = Date.now();

		const messageId = await ctx.db.insert("messages", {
			conversationId: args.conversationId,
			projectId: args.projectId,
			sender: args.sender,
			content: args.content,
			status: args.status,
			createdAt: now,
		});

		// Update conversation's updatedAt
		await ctx.db.patch(args.conversationId, {
			updatedAt: now,
		});

		return messageId;
	},
});

export const updateMessage = mutation({
	args: {
		messageId: v.id("messages"),
		content: v.optional(v.string()),
		status: v.union(
			v.literal("pending"),
			v.literal("sent"),
			v.literal("failed"),
			v.literal("cancelled"),
		),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const message = await ctx.db.get("messages", args.messageId);

		if (!message) {
			throw new createHttpError.NotFound("Message not found");
		}

		const patch: Record<string, unknown> = {
			status: args.status,
		};

		if (args.content !== undefined) {
			patch.content = args.content;
		}

		await ctx.db.patch(args.messageId, patch);
	},
});

export const finalizePendingMessages = mutation({
	args: {
		conversationId: v.id("conversations"),
		status: v.union(v.literal("failed"), v.literal("cancelled")),
		content: v.string(),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const conversation = await ctx.db.get(
			"conversations",
			args.conversationId,
		);

		if (!conversation) {
			throw new createHttpError.NotFound("Conversation not found");
		}

		const pendingMessages = await ctx.db
			.query("messages")
			.withIndex("by_conversation_status", (q) =>
				q
					.eq("conversationId", args.conversationId)
					.eq("status", "pending"),
			)
			.collect();

		// Patch pending messages in parallel
		await Promise.all(
			pendingMessages.map((pendingMessage) =>
				ctx.db.patch(pendingMessage._id, {
					status: args.status,
					content: args.content,
				}),
			),
		);

		return { updatedCount: pendingMessages.length };
	},
});

/* ------------------------------ Conversation ------------------------------ */

export const getConversationById = query({
	args: {
		conversationId: v.id("conversations"),
	},
	handler: async (ctx, args: { conversationId: Id<"conversations"> }) => {
		// Machine authentication is verified automatically via ctx.auth
		// from the custom JWT provider configured in auth.config.ts
		await verifyAuth(ctx);

		const conversation = await ctx.db.get(
			"conversations",
			args.conversationId,
		);

		if (!conversation) {
			throw new createHttpError.NotFound("Conversation not found");
		}

		return conversation;
	},
});

export const updateConversationTitle = mutation({
	args: {
		conversationId: v.id("conversations"),
		title: v.string(),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		await ctx.db.patch(args.conversationId, {
			title: args.title,
			updatedAt: Date.now(),
		});
	},
});

/* ---------------------------------- Files --------------------------------- */

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

		if (
			existingFiles.some(
				(file) => file.name === args.name && file.type === "file",
			)
		) {
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

		// Verify no folder repeats in the same folder
		const existingFiles = await ctx.db
			.query("files")
			.withIndex("by_project_and_parent", (q) =>
				q.eq("projectId", args.projectId).eq("parentId", args.parentId),
			)
			.collect();

		if (
			existingFiles.some(
				(file) => file.name === args.name && file.type === "folder",
			)
		) {
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
				} catch (e) {
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
