"use client";

import FileEditorBreadcrumb from "./file-editor-breadcrumb";
import FileEditorNavigation from "./file-editor-navigation";

export default function FileEditorHeader() {
	return (
		<header className="flex flex-col">
			<FileEditorNavigation />
			<FileEditorBreadcrumb />
		</header>
	);
}
