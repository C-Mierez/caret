import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { WebContainer } from "@webcontainer/api";
import { useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { buildFileTreeFromProject, getFilePath } from "../lib/converter";

let webContainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

async function getWebContainer(): Promise<WebContainer> {
	if (webContainerInstance) {
		return webContainerInstance;
	}

	if (!bootPromise) {
		bootPromise = WebContainer.boot({ coep: "credentialless" });
	}

	webContainerInstance = await bootPromise;

	return webContainerInstance;
}

async function cleanupWebContainer() {
	if (webContainerInstance) {
		webContainerInstance.teardown();
		webContainerInstance = null;
	}
	bootPromise = null;
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
	const files = useQuery(api.files.getOwnedAll, { projectId });

	// Mount
	useEffect(() => {
		if (!enabled || !files || files.length === 0 || hasStartedRef.current) {
			return;
		}

		async function start() {
			// mark started here so failures still allow explicit restarts
			hasStartedRef.current = true;

			try {
				if (isMountedRef.current) setStatus("booting");
				if (isMountedRef.current) setError(null);
				if (isMountedRef.current) setTerminalOutput("");

				if (!files) throw new Error("No files found for the project");

				function appendTerminalOutput(data: string) {
					if (!isMountedRef.current) return;
					setTerminalOutput((prev) => prev + data);
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
					setTerminalOutput(
						(prev) =>
							prev +
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

		return () => {
			cleanupWebContainer();
		};
	}, [enabled, files, settings]);

	// Sync file changes (Hot-Reload)
	useEffect(() => {
		const container = containerRef.current;
		if (!container || !files || status !== "running") return;

		const filesMap = new Map(files.map((file) => [file._id, file]));

		for (const file of files) {
			if (file.type !== "file" || file.storageId || !file.content)
				continue;

			const filePath = getFilePath(file, filesMap);

			container.fs.writeFile(filePath, file.content);
		}
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
