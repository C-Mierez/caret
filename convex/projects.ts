import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const create = mutation({
	args: {
		name: v.string(),
	},
	handler: (ctx, args) => {
		const data = ctx.db.insert("projects", {
			name: args.name,
			ownerId: "123",
		});

		return data;
	},
});

export const get = query({
	args: {},
	handler: async (ctx) => {
		const id = await ctx.auth.getUserIdentity();

		if (!id) {
		}

		const projects = ctx.db.query("projects").collect();

		return projects;
	},
});
