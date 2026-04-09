"use client";

import CaretSvg from "@components/svg/caret-svg";
import useFileEditorContentState from "./use-file-editor-content-state";

export default function FileEditorContent() {
	const {
		project,
		openFiles,
		activeFileId,
		previewFileId,
		editorContainerRef,
	} = useFileEditorContentState();

	if (!activeFileId) {
		// Empty file screen
		return (
			<div className="flex flex-1 flex-col items-center justify-center gap-4">
				<div className="pointer-events-none size-20">
					<CaretSvg className="fill-muted-foreground-alt" />
				</div>
				<p className="text-muted-foreground-alt">
					Select a file to start editing.
				</p>
			</div>
		);
	}

	return <div ref={editorContainerRef} className="min-h-0 flex-1"></div>;
}
