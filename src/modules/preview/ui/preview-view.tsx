"use client";

import { Button } from "@components/ui/button";
import { Allotment } from "allotment";
import {
	AlertTriangleIcon,
	Loader2Icon,
	RefreshCwIcon,
	TerminalSquareIcon,
} from "lucide-react";
import usePreviewViewState from "../hooks/use-preview-view-state";
import PreviewSettingsPopover from "./components/preview-settings-popover";
import PreviewTerminal from "./components/preview-terminal";

export default function PreviewView() {
	const {
		projectId,
		project,
		status,
		isLoading,
		error,
		previewUrl,
		isTerminalOpen,
		toggleTerminal,
		terminalOutput,
		restart,
	} = usePreviewViewState();

	return (
		<div className="flex h-full flex-col bg-background">
			<div className="flex h-8.75 shrink-0 items-center border-b bg-sidebar">
				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="h-full rounded-none"
					disabled={isLoading}
					onClick={restart}
					title="Restart container"
				>
					<RefreshCwIcon className="size-3" />
				</Button>

				<div className="flex h-full flex-1 items-center truncate border-x bg-background px-3 font-mono text-muted-foreground text-xs">
					{isLoading && (
						<div className="flex items-center gap-1.5">
							<Loader2Icon className="size-3 animate-spin" />
							{status === "booting"
								? "Starting..."
								: "Installing..."}
						</div>
					)}
					{previewUrl && (
						<span className="truncate">{previewUrl}</span>
					)}
					{!isLoading && !previewUrl && !error && (
						<span>Ready to preview</span>
					)}
				</div>

				<Button
					type="button"
					size="sm"
					variant="ghost"
					className="h-full rounded-none"
					title="Toggle terminal"
					onClick={toggleTerminal}
				>
					<TerminalSquareIcon className="size-3" />
				</Button>
				{projectId && (
					<PreviewSettingsPopover
						projectId={projectId}
						initialValues={project?.settings}
						onSave={restart}
					/>
				)}
			</div>

			<div className="min-h-0 flex-1">
				<Allotment vertical>
					<Allotment.Pane>
						{error && (
							<div className="flex size-full items-center justify-center text-muted-foreground">
								<div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
									<AlertTriangleIcon className="size-6" />
									<p className="font-medium text-sm">
										{error}
									</p>
									<Button
										size="sm"
										variant="outline"
										onClick={restart}
									>
										<RefreshCwIcon className="size-4" />
										Restart
									</Button>
								</div>
							</div>
						)}

						{isLoading && !error && (
							<div className="flex size-full items-center justify-center text-muted-foreground">
								<div className="mx-auto flex max-w-md flex-col items-center gap-2 text-center">
									<Loader2Icon className="size-6 animate-spin" />
									<p className="font-medium text-sm">
										{status === "booting"
											? "Starting..."
											: "Installing..."}
									</p>
								</div>
							</div>
						)}

						{previewUrl && !error && (
							<iframe
								src={previewUrl}
								className="size-full border-0"
								title="Preview"
							/>
						)}
					</Allotment.Pane>

					{isTerminalOpen && (
						<Allotment.Pane
							minSize={100}
							maxSize={500}
							preferredSize={200}
						>
							<div className="flex h-full flex-col border-t bg-background">
								<div className="flex h-7 shrink-0 items-center gap-1.5 border-border/50 border-b px-3 text-muted-foreground text-xs">
									<TerminalSquareIcon className="size-3" />
									Terminal
								</div>
								<PreviewTerminal output={terminalOutput} />
							</div>
						</Allotment.Pane>
					)}
				</Allotment>
			</div>
		</div>
	);
}
