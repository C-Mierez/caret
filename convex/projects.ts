import type { PaginationOptions } from "convex/server";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { verifyProjectOwnership } from "./lib/auth";
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

export const getOwnedAll = query({
	args: {},
	handler: withAuth(async (ctx) => {
		return await ctx.db
			.query("projects")
			.withIndex("by_owner", (q) => q.eq("ownerId", ctx.identity.subject))
			.collect();
	}),
});

export const getOwnedCount = query({
	args: {},
	handler: withAuth(async (ctx) => {
		const projects = await ctx.db
			.query("projects")
			.withIndex("by_owner", (q) => q.eq("ownerId", ctx.identity.subject))
			.collect();

		return projects.length;
	}),
});

export const getOwnedInfinite = query({
	args: {
		paginationOpts: paginationOptsValidator,
	},
	handler: withAuth(
		async (ctx, args: { paginationOpts: PaginationOptions }) => {
			return await ctx.db
				.query("projects")
				.withIndex("by_owner", (q) =>
					q.eq("ownerId", ctx.identity.subject),
				)
				.order("desc")
				.paginate(args.paginationOpts);
		},
	),
});

export const getOwnedById = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: withAuth(async (ctx, args: { projectId: Id<"projects"> }) => {
		return verifyProjectOwnership(ctx, args.projectId);
	}),
});

export const rename = mutation({
	args: {
		projectId: v.id("projects"),
		newName: v.string(),
	},
	handler: withAuth(
		async (ctx, args: { projectId: Id<"projects">; newName: string }) => {
			await verifyProjectOwnership(ctx, args.projectId);

			// Wont throw since project is verified already
			await ctx.db.patch("projects", args.projectId, {
				name: args.newName,
				updated_at: Date.now(),
			});
		},
	),
});
