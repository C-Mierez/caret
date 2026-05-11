import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { verifyAuth } from "../lib/auth";
import { updateProjectTimestamp } from "../lib/utils";

/* -------------------------------- Mutations ------------------------------- */

// A system call meant to be used when creating from a github repo
export const create = mutation({
	args: {
		name: v.string(),
		ownerId: v.string(),
	},
	handler: async (ctx, args) => {
		return await ctx.db.insert("projects", {
			name: args.name,
			ownerId: args.ownerId,
			updated_at: Date.now(),
			importStatus: "importing",
			exportStatus: "not_started",
		});
	},
});

export const updateImportStatus = mutation({
	args: {
		projectId: v.id("projects"),
		importStatus: v.union(
			v.literal("not_started"),
			v.literal("importing"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("canceled"),
		),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const now = Date.now();

		await ctx.db.patch(args.projectId, {
			importStatus: args.importStatus,
			updated_at: now,
		});

		await updateProjectTimestamp(ctx, args.projectId, now);
	},
});

export const updateExportStatus = mutation({
	args: {
		projectId: v.id("projects"),
		exportStatus: v.union(
			v.literal("not_started"),
			v.literal("exporting"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("canceled"),
		),
		exportRepoUrl: v.optional(v.string()),
		exportDescription: v.optional(v.string()),
		exportVisibility: v.optional(
			v.union(v.literal("private"), v.literal("public")),
		),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const now = Date.now();

		await ctx.db.patch(args.projectId, {
			exportStatus: args.exportStatus,
			exportRepoUrl: args.exportRepoUrl,
			exportDescription: args.exportDescription,
			exportVisibility: args.exportVisibility,
			updated_at: now,
		});

		await updateProjectTimestamp(ctx, args.projectId, now);
	},
});

export const getProject = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const project = await ctx.db.get(args.projectId);

		if (!project) {
			return null;
		}

		return project;
	},
});

export const deleteProject = mutation({
	args: {
		projectId: v.id("projects"),
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		await ctx.db.delete(args.projectId);
	},
});
