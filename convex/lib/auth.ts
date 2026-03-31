import type { Id } from "@convex/_generated/dataModel";
import createError from "http-errors";
import type { AuthedCtx, ConvexAuthCtx, IdentityFromCtx } from "./types";

export async function verifyAuth<TCtx extends ConvexAuthCtx>(
	ctx: TCtx,
): Promise<IdentityFromCtx<TCtx>> {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) throw createError.Unauthorized();

	return identity as IdentityFromCtx<TCtx>;
}

export async function verifyProjectOwnership<TCtx extends ConvexAuthCtx>(
	ctx: AuthedCtx<TCtx>,
	projectId: Id<"projects">,
) {
	const project = await ctx.db.get("projects", projectId);

	if (!project) throw createError.NotFound("Project not found");

	if (project.ownerId !== ctx.identity.subject)
		throw createError.Forbidden("You do not have access to this project");

	return project;
}
