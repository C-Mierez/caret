"use client";

import usePreviewTerminalState from "@modules/preview/hooks/use-preview-terminal-state";

interface Props {
	output: string;
}

export default function PreviewTerminal({ output }: Props) {
	const { containerRef } = usePreviewTerminalState(output);

	return (
		<div
			ref={containerRef}
			className="min-h-0 flex-1 bg-background p-2 [&_.xterm-screen]:h-full! [&_.xterm-viewport]:h-full! [&_.xterm]:h-full!"
		></div>
	);
}
