import { v } from "convex/values";
import createHttpError from "http-errors";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { verifyAuth } from "./lib/auth";

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

		await ctx.db.patch(args.messageId, {
			status: args.status,
			content: args.content,
		});
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

		const pendingMessages = await ctx.db
			.query("messages")
			.withIndex("by_conversation_status", (q) =>
				q
					.eq("conversationId", args.conversationId)
					.eq("status", "pending"),
			)
			.collect();

		for (const pendingMessage of pendingMessages) {
			await ctx.db.patch(pendingMessage._id, {
				status: args.status,
				content: args.content,
			});
		}

		return { updatedCount: pendingMessages.length };
	},
});
