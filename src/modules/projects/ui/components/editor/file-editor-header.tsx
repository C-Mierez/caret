"use client";

import FileEditorNavigation from "./file-editor-navigation";

export default function FileEditorHeader() {
	return (
		<header className="flex flex-col">
			<FileEditorNavigation />
			<div className="h-tabs bg-muted">Breadcrumb</div>
		</header>
	);
}
