import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { withAuth } from "./lib/hoc";

export const create = mutation({
	args: {
		name: v.string(),
	},
	handler: withAuth(async (ctx, args: { name: string }) => {
		return await ctx.db.insert("projects", {
			name: args.name,
			ownerId: ctx.identity.subject,
			updated_at: Date.now(),
			importStatus: "not_started",
			exportStatus: "not_started",
		});
	}),
});

export const getOwnedPartial = query({
	args: {
		limit: v.number(),
	},
	handler: withAuth(async (ctx, args: { limit: number }) => {
		return await ctx.db
			.query("projects")
			.withIndex("by_owner", (q) => q.eq("ownerId", ctx.identity.subject))
			.take(args.limit);
	}),
});
