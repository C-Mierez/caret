import { verifyAuth } from "./auth";
import type { AuthedCtx, ConvexAuthCtx } from "./types";

export function withAuth<TCtx extends ConvexAuthCtx, TArgs, TReturn>(
	handler: (ctx: AuthedCtx<TCtx>, args: TArgs) => TReturn | Promise<TReturn>,
) {
	return async (ctx: TCtx, args: TArgs): Promise<TReturn> => {
		const identity = await verifyAuth(ctx);

		return handler({ ...ctx, identity }, args);
	};
}
