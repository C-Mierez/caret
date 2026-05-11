import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { WebContainer } from "@webcontainer/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildFileTreeFromProject, getFilePath } from "../lib/converter";

// Persist instance/bootPromise on globalThis so HMR or duplicate module
// evaluations don't attempt to boot multiple WebContainer instances.
type _GlobalWebContainer = {
	__webcontainerInstance?: WebContainer;
	__webcontainerBootPromise?: Promise<WebContainer>;
};
const G = globalThis as unknown as _GlobalWebContainer;

let webContainerInstance: WebContainer | null =
	G.__webcontainerInstance ?? null;
let bootPromise: Promise<WebContainer> | null =
	G.__webcontainerBootPromise ?? null;

async function getWebContainer(): Promise<WebContainer> {
	if (typeof self !== "undefined" && !self.crossOriginIsolated) {
		throw new Error(
			"Preview requires cross-origin isolation (SharedArrayBuffer). Ensure COOP/COEP headers are configured before booting WebContainer.",
		);
	}

	if (webContainerInstance) {
		return webContainerInstance;
	}

	if (bootPromise) {
		// Another caller is already booting; await the in-flight boot.
		return await bootPromise;
	}

	// Start boot and persist the promise globally so other module copies
	// (HMR) won't attempt a second boot.
	bootPromise = (async () => {
		try {
			const wc = await WebContainer.boot({ coep: "credentialless" });
			webContainerInstance = wc;
			G.__webcontainerInstance = wc;
			return wc;
		} catch (err: unknown) {
			// If the runtime reports that only a single instance can be
			// booted, surface a clearer error and ensure we don't leave a
			// dangling bootPromise that will reject for future callers.
			const msg = String((err as Error)?.message ?? err);
			if (
				msg.includes(
					"Only a single WebContainer instance can be booted",
				) ||
				msg.includes("Unable to create more instances")
			) {
				// Clean up global boot promise so future attempts can retry
				bootPromise = null;
				delete G.__webcontainerBootPromise;
				throw new Error(
					"WebContainer instance limit reached. Reuse the existing preview, click Restart, or refresh the page.",
				);
			}

			// For other errors, clear bootPromise and rethrow.
			bootPromise = null;
			delete G.__webcontainerBootPromise;
			throw err;
		}
	})();

	G.__webcontainerBootPromise = bootPromise;

	webContainerInstance = await bootPromise;

	return webContainerInstance;
}

async function cleanupWebContainer() {
	if (webContainerInstance) {
		try {
			await webContainerInstance.teardown();
		} catch (_err) {
			// ignore teardown errors
		}
		webContainerInstance = null;
		delete G.__webcontainerInstance;
	}

	bootPromise = null;
	delete G.__webcontainerBootPromise;
}

interface Props {
	projectId: Id<"projects">;
	enabled: boolean;
	settings?: {
		installCommand?: string;
		devCommand?: string;
	};
}

export function useWebContainer({ projectId, enabled, settings }: Props) {
	const [status, setStatus] = useState<
		"idle" | "booting" | "installing" | "running" | "error"
	>("idle");

	const [previewUrl, setPreviewUrl] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [_restartKey, setRestartKey] = useState<number>(0);
	const [terminalOutput, setTerminalOutput] = useState<string>("");

	// Bounded terminal output buffer to avoid unbounded string growth.
	const terminalBufferRef = useRef<string[]>([]);
	const MAX_TERMINAL_LINES = 1000;

	function appendTerminalChunk(chunk: string) {
		const buf = terminalBufferRef.current;
		buf.push(chunk);
		while (buf.length > MAX_TERMINAL_LINES) buf.shift();
		// expose a truncated aggregated string to React state
		if (isMountedRef.current) setTerminalOutput(buf.join(""));
	}

	function clearTerminalBuffer() {
		terminalBufferRef.current = [];
		if (isMountedRef.current) setTerminalOutput("");
	}

	const containerRef = useRef<WebContainer | null>(null);
	const hasStartedRef = useRef(false);
	const isMountedRef = useRef(true);

	useEffect(() => {
		isMountedRef.current = true;
		return () => {
			isMountedRef.current = false;
		};
	}, []);

	// Fetch the files
	// Since this is convex, files will auto-update on changes
	const files = useQuery(api.user.files.getOwnedAll, { projectId });

	// Mount
	// biome-ignore lint/correctness/useExhaustiveDependencies: ...
	useEffect(() => {
		// Read the restart key so the effect re-runs when it changes.
		void _restartKey;

		if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
			return;
		}

		async function start() {
			// mark started here so failures still allow explicit restarts
			hasStartedRef.current = true;

			try {
				if (isMountedRef.current) setStatus("booting");
				if (isMountedRef.current) setError(null);
				clearTerminalBuffer();

				if (!files) throw new Error("No files found for the project");

				function appendTerminalOutput(data: string) {
					if (!isMountedRef.current) return;
					appendTerminalChunk(data);
				}

				const container = await getWebContainer();
				containerRef.current = container;

				const fileTree = buildFileTreeFromProject(files);
				await container.mount(fileTree);
				setStatus("installing");

				container.on("server-ready", (_port, url) => {
					if (!isMountedRef.current) return;
					setPreviewUrl(url);
					setStatus("running");
				});

				// Parse the install command to get the base command for running in the terminal
				const installCmd = settings?.installCommand || "npm install";
				const [installBin, ...installArgs] = installCmd.split(" ");

				appendTerminalOutput(`$ ${installCmd}\n`);

				const installProcess = await container.spawn(
					installBin,
					installArgs,
				);
				installProcess.output.pipeTo(
					new WritableStream({
						write(data) {
							appendTerminalOutput(data);
						},
					}),
				);

				const installExitCode = await installProcess.exit;
				if (installExitCode !== 0) {
					throw new Error(
						`${installCmd} failed with exit code ${installExitCode}`,
					);
				}

				// Parse the dev command to get the base command for running in the terminal
				const devCmd = settings?.devCommand || "npm run dev";
				const [devBin, ...devArgs] = devCmd.split(" ");

				appendTerminalOutput(`$ ${devCmd}\n`);

				const devProcess = await container.spawn(devBin, devArgs);
				devProcess.output.pipeTo(
					new WritableStream({
						write(data) {
							appendTerminalOutput(data);
						},
					}),
				);
			} catch (rawErr) {
				const err =
					rawErr instanceof Error
						? rawErr
						: new Error(String(rawErr));
				// expose the error message to the central UI and terminal for debugging
				if (isMountedRef.current)
					setError(`Failed to boot web container: ${err.message}`);
				if (isMountedRef.current)
					appendTerminalChunk(
						`\n[webcontainer error] ${err.message}\n${err.stack || ""}\n`,
					);
				// ensure the container instance is cleaned up in case of partial boot
				try {
					await cleanupWebContainer();
				} catch (_cleanupErr) {
					// ignore cleanup errors
				}
				// allow explicit restart attempts
				hasStartedRef.current = false;
				console.error(err);
			}
		}

		start();
	}, [
		enabled,
		files,
		settings?.installCommand,
		settings?.devCommand,
		_restartKey,
	]);

	// Teardown only on unmount to avoid repeated re-boots on reactive updates.
	useEffect(() => {
		return () => {
			hasStartedRef.current = false;
			cleanupWebContainer();
		};
	}, []);

	// Sync file changes (Hot-Reload)
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !files || status !== "running") return;

		const filesMap = new Map(files.map((file) => [file._id, file]));

		(async () => {
			const writes: Promise<unknown>[] = [];

			for (const file of files) {
				// allow empty string content; only skip null/undefined
				if (
					file.type !== "file" ||
					file.storageId ||
					file.content === undefined ||
					file.content === null
				)
					continue;

				const filePath = getFilePath(file, filesMap);

				writes.push(container.fs.writeFile(filePath, file.content));
			}

			if (writes.length === 0) return;

			try {
				await Promise.all(writes);
			} catch (err) {
				console.error(
					"Failed to write files to webcontainer during hot-reload",
					err,
				);
			}
		})();
	}, [files, status]);

	// Reset when disabled
	useEffect(() => {
		if (enabled) return;

		hasStartedRef.current = false;
		setStatus("idle");
		setPreviewUrl(null);
		setError(null);
	}, [enabled]);

	// Restart the container when the restart key changes
	const restart = useCallback(() => {
		cleanupWebContainer();
		hasStartedRef.current = false;
		containerRef.current = null;
		setStatus("idle");
		setPreviewUrl(null);
		setError(null);
		setRestartKey((k) => k + 1);
	}, []);

	return {
		status,
		previewUrl,
		error,
		terminalOutput,
		restart,
	};
}
