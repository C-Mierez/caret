import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import { useEffect, useRef } from "react";

export default function usePreviewTerminalState(output: string) {
	const containerRef = useRef<HTMLDivElement | null>(null);
	const terminalRef = useRef<Terminal | null>(null);
	const fitAddonRef = useRef<FitAddon | null>(null);
	const lastLengthRef = useRef(0);

	// Initialize terminal
	// biome-ignore lint/correctness/useExhaustiveDependencies: We only want to run this effect once on mount
	useEffect(() => {
		if (!containerRef.current || !terminalRef.current) return;

		const terminal = new Terminal({
			convertEol: true,
			disableStdin: true,
			fontSize: 12,
			fontFamily: '"JetBrains Mono", monospace',
			theme: {
				background: "#14171d",
			},
		});

		const fitAddon = new FitAddon();

		terminal.loadAddon(fitAddon);
		terminal.open(containerRef.current);

		terminalRef.current = terminal;
		fitAddonRef.current = fitAddon;

		// Write the existing output
		if (output) {
			terminal.write(output);
			lastLengthRef.current = output.length;
		}

		// Request animation frame to fit the terminal after it has been rendered
		requestAnimationFrame(() => {
			fitAddon.fit();
		});

		// Resizable observer to fit terminal on container resize
		const resizeObserver = new ResizeObserver(() => {
			fitAddon.fit();
		});
		resizeObserver.observe(containerRef.current);

		return () => {
			resizeObserver.disconnect();
			terminal.dispose();
			terminalRef.current = null;
			fitAddonRef.current = null;
		};
	}, []);

	// Write output
	useEffect(() => {
		if (!terminalRef.current) return;

		if (output.length < lastLengthRef.current) {
			terminalRef.current.clear();
			lastLengthRef.current = 0;
		}

		const newData = output.slice(lastLengthRef.current);
		if (newData) {
			terminalRef.current.write(newData);
			lastLengthRef.current = output.length;
			fitAddonRef.current?.fit();
		}
	}, [output]);

	return {
		containerRef,
	};
}
