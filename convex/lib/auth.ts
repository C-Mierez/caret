import createError from "http-errors";
import type { ConvexAuthCtx, IdentityFromCtx } from "./types";

export async function verifyAuth<TCtx extends ConvexAuthCtx>(
	ctx: TCtx,
): Promise<IdentityFromCtx<TCtx>> {
	const identity = await ctx.auth.getUserIdentity();

	if (!identity) throw createError.Unauthorized();

	return identity as IdentityFromCtx<TCtx>;
}
