import { AlertCircleIcon } from "lucide-react";

export default function UnsupportedFileScreen() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
			<div className="flex size-16 items-center justify-center rounded-full border border-border bg-muted/40 text-muted-foreground-alt">
				<AlertCircleIcon className="size-8" />
			</div>
			<div className="space-y-1">
				<p className="font-medium text-foreground text-sm">
					Unsupported file
				</p>
				<p className="max-w-sm text-muted-foreground-alt text-sm">
					This file is stored as binary content and can’t be edited in
					the text editor.
				</p>
			</div>
		</div>
	);
}
