import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
	projects: defineTable({
		name: v.string(),
		ownerId: v.string(),
		updated_at: v.number(),
		importStatus: v.union(
			v.literal("not_started"),
			v.literal("importing"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("canceled"),
		),

		exportStatus: v.union(
			v.literal("not_started"),
			v.literal("exporting"),
			v.literal("completed"),
			v.literal("failed"),
			v.literal("canceled"),
		),

		exportRepoUrl: v.optional(v.string()), // URL of the Git repository, if it exists
	}).index("by_owner", ["ownerId"]),
});
