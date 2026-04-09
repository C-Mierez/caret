import { javascript } from "@codemirror/lang-javascript";
import { oneDark } from "@codemirror/theme-one-dark";
import { useFileEditorStore } from "@modules/file-editor/stores/use-file-editor-store";
import { basicSetup, EditorView } from "codemirror";
import { useEffect, useRef } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function useFileEditorContentState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	const projectFileState = useFileEditorStore((state) =>
		state.projectFileStates.get(project._id),
	);

	const openFiles = projectFileState?.openFiles ?? [];
	const activeFileId = projectFileState?.activeFileId ?? null;
	const previewFileId = projectFileState?.previewFileId ?? null;

	// Code Mirror stuff
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const editorViewRef = useRef<EditorView | null>(null);

	useEffect(() => {
		const container = editorContainerRef.current;

		if (!container || !activeFileId) return;

		const view = new EditorView({
			doc: `import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";

export default function useFileEditorContentState() {

	// Code Mirror stuff
	const editorContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!container || !activeFileId) return;

		const view = new EditorView({
			doc: "Start document",
			parent: container,
			extensions: [
				basicSetup,
				javascript({ jsx: true, typescript: true }),
			],
		});

		editorViewRef.current = view;

		return () => {
			view.destroy();
		};
	}, [activeFileId]);

	return {
		project,
	};
}
`,
			parent: container,
			extensions: [
				basicSetup,
				javascript({ jsx: true, typescript: true }),
				oneDark,
			],
		});

		editorViewRef.current = view;

		return () => {
			view.destroy();
		};
	}, [activeFileId]);

	return {
		project,
		openFiles,
		activeFileId,
		previewFileId,
		editorContainerRef,
		editorViewRef,
	};
}
