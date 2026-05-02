import { sentryMiddleware } from "@inngest/middleware-sentry";
import { Inngest } from "inngest";
import { pinoTracingMiddleware } from "@/inngest/middleware/pino-tracing";

// Create a client to send and receive events
export const inngest = new Inngest({
	id: "my-app",
	middleware: [sentryMiddleware(), pinoTracingMiddleware()],
});
