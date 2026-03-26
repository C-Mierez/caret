import type { MutationCtx, QueryCtx } from "@convex/_generated/server";

export type ConvexAuthCtx = QueryCtx | MutationCtx;

export type IdentityFromCtx<TCtx extends ConvexAuthCtx> = NonNullable<
	Awaited<ReturnType<TCtx["auth"]["getUserIdentity"]>>
>;

export type AuthedCtx<TCtx extends ConvexAuthCtx> = TCtx & {
	identity: IdentityFromCtx<TCtx>;
};
