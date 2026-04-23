import { v } from "convex/values";
import createHttpError from "http-errors";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { verifyProjectOwnership } from "./lib/auth";
import { withAuth } from "./lib/hoc";

export const getOwnedById = query({
	args: {
		id: v.id("conversations"),
	},
	handler: withAuth(async (ctx, args: { id: Id<"conversations"> }) => {
		const conversation = await ctx.db.get("conversations", args.id);

		if (!conversation) {
			throw new createHttpError.NotFound("Conversation not found");
		}

		await verifyProjectOwnership(ctx, conversation.projectId);

		return conversation;
	}),
});

export const getOwnedByProject = query({
	args: {
		projectId: v.id("projects"),
	},
	handler: withAuth(async (ctx, args: { projectId: Id<"projects"> }) => {
		await verifyProjectOwnership(ctx, args.projectId);

		return await ctx.db
			.query("conversations")
			.withIndex("by_project", (q) => q.eq("projectId", args.projectId))
			.collect();
	}),
});

export const getMessagesByConversation = query({
	args: {
		conversationId: v.id("conversations"),
	},
	handler: withAuth(
		async (ctx, args: { conversationId: Id<"conversations"> }) => {
			const conversation = await ctx.db.get(
				"conversations",
				args.conversationId,
			);

			if (!conversation) {
				throw new createHttpError.NotFound("Conversation not found");
			}

			await verifyProjectOwnership(ctx, conversation.projectId);

			return await ctx.db
				.query("messages")
				.withIndex("by_conversation", (q) =>
					q.eq("conversationId", args.conversationId),
				)
				.order("asc")
				.collect();
		},
	),
});

export const create = mutation({
	args: {
		projectId: v.id("projects"),
		title: v.string(),
	},
	handler: withAuth(
		async (
			ctx,
			args: {
				projectId: Id<"projects">;
				title: string;
			},
		) => {
			await verifyProjectOwnership(ctx, args.projectId);

			const conversationId = await ctx.db.insert("conversations", {
				projectId: args.projectId,
				title: args.title,
				updatedAt: Date.now(),
			});

			return conversationId;
		},
	),
});
