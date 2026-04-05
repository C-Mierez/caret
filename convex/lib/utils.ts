import type { Id } from "@convex/_generated/dataModel";
import type { MutationCtx } from "@convex/_generated/server";
import type { AuthedCtx } from "./types";

export async function updateProjectTimestamp(
	ctx: AuthedCtx<MutationCtx>,
	projectId: Id<"projects">,
	timestamp: number,
) {
	await ctx.db.patch("projects", projectId, {
		updated_at: timestamp,
	});
}
