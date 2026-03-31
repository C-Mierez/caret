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

	files: defineTable({
		projectId: v.id("projects"),
		parentId: v.optional(v.id("files")),
		name: v.string(),
		type: v.union(v.literal("file"), v.literal("folder")),
		content: v.optional(v.string()), // For text files
		storageId: v.optional(v.id("_storage")), // Binary files
		updatedAt: v.number(),
	})
		.index("by_project", ["projectId"])
		.index("by_parent", ["parentId"])
		.index("by_project_and_parent", ["projectId", "parentId"]),
});
