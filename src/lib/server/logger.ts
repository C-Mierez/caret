import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import pino from "pino";

type TraceContext = {
	eventId?: string;
	runId?: string;
	functionId?: string;
};

const traceContextStorage = new AsyncLocalStorage<TraceContext>();
let consoleBridgeInstalled = false;

export const logger = pino({
	base: undefined,
	level: process.env.LOG_LEVEL ?? "info",
	mixin() {
		const trace = traceContextStorage.getStore();

		if (!trace) {
			return {};
		}

		return {
			trace,
		};
	},
});

export function runWithTraceContext<T>(
	traceContext: TraceContext,
	fn: () => Promise<T>,
): Promise<T> {
	return traceContextStorage.run(traceContext, fn);
}

export function installConsoleBridge() {
	if (consoleBridgeInstalled) {
		return;
	}

	const originalLog = console.log.bind(console);
	const originalInfo = console.info.bind(console);
	const originalWarn = console.warn.bind(console);
	const originalError = console.error.bind(console);

	const logFromConsole = (
		level: "info" | "warn" | "error",
		fallback: (...args: unknown[]) => void,
		args: unknown[],
	) => {
		if (!traceContextStorage.getStore()) {
			fallback(...args);
			return;
		}

		logger[level]({ consoleArgs: args }, `console.${level}`);
	};

	console.log = (...args: unknown[]) => {
		logFromConsole("info", originalLog, args);
	};

	console.info = (...args: unknown[]) => {
		logFromConsole("info", originalInfo, args);
	};

	console.warn = (...args: unknown[]) => {
		logFromConsole("warn", originalWarn, args);
	};

	console.error = (...args: unknown[]) => {
		logFromConsole("error", originalError, args);
	};

	consoleBridgeInstalled = true;
}
