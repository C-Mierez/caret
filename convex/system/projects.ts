import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { verifyAuth } from "../lib/auth";
import { updateProjectTimestamp } from "../lib/utils";

/* -------------------------------- Mutations ------------------------------- */

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
	},
	handler: async (ctx, args) => {
		await verifyAuth(ctx);

		const now = Date.now();

		await ctx.db.patch(args.projectId, {
			exportStatus: args.exportStatus,
			exportRepoUrl: args.exportRepoUrl,
			updated_at: now,
		});

		await updateProjectTimestamp(ctx, args.projectId, now);
	},
});
