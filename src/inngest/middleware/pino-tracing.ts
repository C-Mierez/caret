import { Middleware } from "inngest";
import { installConsoleBridge, runWithTraceContext } from "@/lib/server/logger";

class InngestPinoTracingMiddleware extends Middleware.BaseMiddleware {
	readonly id = "inngest:pino-tracing";

	async wrapFunctionHandler(args: Middleware.WrapFunctionHandlerArgs) {
		installConsoleBridge();
		const functionId = args.fn.id();

		const eventId =
			typeof args.ctx.event.id === "string"
				? args.ctx.event.id
				: undefined;

		return await runWithTraceContext(
			{
				eventId,
				runId: args.ctx.runId,
				functionId,
			},
			args.next,
		);
	}
}

export function pinoTracingMiddleware() {
	return InngestPinoTracingMiddleware;
}
