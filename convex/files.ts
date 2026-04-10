import { v } from "convex/values";
import createHttpError from "http-errors";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { verifyProjectOwnership } from "./lib/auth";
import { withAuth } from "./lib/hoc";
import { updateProjectTimestamp } from "./lib/utils";

export const getOwnedAll = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: withAuth(async (ctx, args: { projectId: Id<"projects"> }) => {
		await verifyProjectOwnership(ctx, args.projectId);

		return await ctx.db
			.query("files")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
	}),
});

export const getOwnedById = query({
	args: {
		fileId: v.id("files"),
	},
	handler: withAuth(async (ctx, args: { fileId: Id<"files"> }) => {
		const file = await ctx.db.get("files", args.fileId);

		if (!file) throw createHttpError.NotFound("File not found");

		await verifyProjectOwnership(ctx, file.projectId);

		return file;
	}),
});

export const getOwnedPathToRoot = query({
	args: {
		fileId: v.id("files"),
	},
	handler: withAuth(async (ctx, args: { fileId: Id<"files"> }) => {
		const file = await ctx.db.get("files", args.fileId);

		if (!file) {
			return {
				folderPathIds: [],
			};
		}

		await verifyProjectOwnership(ctx, file.projectId);

		const folderPathIds: Pick<Doc<"files">, "_id" | "name">[] = [];
		let currentId: Id<"files"> | undefined =
			file.type === "folder" ? file._id : file.parentId;

		while (currentId) {
			const current = await ctx.db.get("files", currentId);

			if (!current || current.projectId !== file.projectId) break;

			if (current.type === "folder") {
				folderPathIds.unshift({
					_id: current._id,
					name: current.name,
				});
			}

			currentId = current.parentId;
		}

		return {
			folderPathIds,
		};
	}),
});

export const getOwnedSorted = query({
	args: {
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				projectId: Id<"projects">;
				parentId: Id<"files"> | undefined;
			},
		) => {
			await verifyProjectOwnership(ctx, args.projectId);

			const files = await ctx.db
				.query("files")
				.withIndex("by_project_and_parent", (q) =>
					q
						.eq("projectId", args.projectId)
						.eq("parentId", args.parentId),
				)
				.collect();

			// Sort folders first, then files, both alphabetically by name
			return files.sort((a, b) => {
				if (a.type === "folder" && b.type === "file") return -1;
				if (a.type === "file" && b.type === "folder") return 1;

				return a.name.localeCompare(b.name);
			});
		},
	),
});

export const createFile = mutation({
	args: {
		name: v.string(),
		content: v.string(),
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				name: string;
				content: string;
				projectId: Id<"projects">;
				parentId: Id<"files"> | undefined;
			},
		) => {
			await verifyProjectOwnership(ctx, args.projectId);

			const files = await ctx.db
				.query("files")
				.withIndex("by_project_and_parent", (q) =>
					q
						.eq("projectId", args.projectId)
						.eq("parentId", args.parentId),
				)
				.collect();

			const existingFile = files.find(
				(file) => file.name === args.name && file.type === "file",
			);

			if (existingFile)
				throw createHttpError.Conflict(
					"A file with the same name already exists in this folder",
				);

			const now = Date.now();

			await ctx.db.insert("files", {
				name: args.name,
				projectId: args.projectId,
				parentId: args.parentId,
				type: "file",
				updatedAt: now,
			});

			await updateProjectTimestamp(ctx, args.projectId, now);
		},
	),
});

export const createFolder = mutation({
	args: {
		name: v.string(),
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				name: string;
				projectId: Id<"projects">;
				parentId: Id<"files"> | undefined;
			},
		) => {
			await verifyProjectOwnership(ctx, args.projectId);

			const files = await ctx.db
				.query("files")
				.withIndex("by_project_and_parent", (q) =>
					q
						.eq("projectId", args.projectId)
						.eq("parentId", args.parentId),
				)
				.collect();

			const existingFile = files.find(
				(file) => file.name === args.name && file.type === "folder",
			);

			if (existingFile)
				throw createHttpError.Conflict(
					"A folder with the same name already exists in this folder",
				);

			const now = Date.now();

			await ctx.db.insert("files", {
				name: args.name,
				projectId: args.projectId,
				parentId: args.parentId,
				type: "folder",
				updatedAt: now,
			});

			await updateProjectTimestamp(ctx, args.projectId, now);
		},
	),
});

export const rename = mutation({
	args: {
		fileId: v.id("files"),
		newName: v.string(),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				fileId: Id<"files">;
				newName: string;
			},
		) => {
			const file = await ctx.db.get("files", args.fileId);

			if (!file) throw createHttpError.NotFound("File not found");

			await verifyProjectOwnership(ctx, file.projectId);

			// Verify name conflict with sibling files
			const siblings = await ctx.db
				.query("files")
				.withIndex("by_project_and_parent", (q) =>
					q
						.eq("projectId", file.projectId)
						.eq("parentId", file.parentId),
				)
				.collect();

			const existingFile = siblings.find(
				(f) =>
					f.name === args.newName &&
					f._id !== args.fileId &&
					f.type === file.type,
			);

			if (existingFile)
				throw createHttpError.Conflict(
					`A ${file.type} with the same name already exists in this folder`,
				);

			const now = Date.now();

			await ctx.db.patch("files", args.fileId, {
				name: args.newName,
				updatedAt: now,
			});

			await updateProjectTimestamp(ctx, file.projectId, now);
		},
	),
});

export const remove = mutation({
	args: {
		fileId: v.id("files"),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				fileId: Id<"files">;
			},
		) => {
			const file = await ctx.db.get("files", args.fileId);

			if (!file) throw createHttpError.NotFound("File not found");

			await verifyProjectOwnership(ctx, file.projectId);

			//? Check if this is potentially a risky approach for stack overflow threat? I'd image it's unlikely due to the domain - folders are probably not too deep lol
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

				// Delete storage if exists
				if (currentFile.storageId)
					await ctx.storage.delete(currentFile.storageId);
				// Delete file
				await ctx.db.delete(fileId);
			};

			await deleteFileAndChildren(args.fileId);

			await updateProjectTimestamp(ctx, file.projectId, Date.now());
		},
	),
});

export const updateContent = mutation({
	args: {
		fileId: v.id("files"),
		content: v.string(),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				fileId: Id<"files">;
				content: string;
			},
		) => {
			const file = await ctx.db.get("files", args.fileId);

			if (!file) throw createHttpError.NotFound("File not found");

			await verifyProjectOwnership(ctx, file.projectId);

			if (file.type !== "file")
				throw createHttpError.BadRequest("Only files can have content");

			const now = Date.now();

			await ctx.db.patch("files", args.fileId, {
				content: args.content,
				updatedAt: now,
			});

			await updateProjectTimestamp(ctx, file.projectId, now);
		},
	),
});
