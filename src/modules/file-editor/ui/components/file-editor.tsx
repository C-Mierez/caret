"use client";

import FileEditorContent from "./file-editor-content";
import FileEditorHeader from "./file-editor-header";

export default function FileEditor() {
	return (
		<main className="flex h-full min-h-0 flex-col">
			<FileEditorHeader />
			<FileEditorContent />
		</main>
	);
}
