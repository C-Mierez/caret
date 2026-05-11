import { v } from "convex/values";
import createHttpError from "http-errors";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { verifyAuth } from "../lib/auth";

/* --------------------------------- Queries -------------------------------- */

export const getConversationById = query({
	args: {
		conversationId: v.id("conversations"),
	},
	handler: async (ctx, args: { conversationId: Id<"conversations"> }) => {
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
			.order("desc")
			.take(Math.max(1, Math.min(args.limit ?? 10, 1000)));

		return messages.reverse();
	},
});

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

/* -------------------------------- Mutations ------------------------------- */

export const createMessage = mutation({
	args: {
		conversationId: v.id("conversations"),
		projectId: v.id("projects"),
		sender: v.union(v.literal("user"), v.literal("assistant")),
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
			content: args.content ?? "",
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
