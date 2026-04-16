import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import { keymap } from "@codemirror/view";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useFileEditorStore } from "@modules/file-editor/stores/use-file-editor-store";
import useFilesUpdateContent from "@modules/projects/hooks/use-files-updateContent";
import { indentationMarkers } from "@replit/codemirror-indentation-markers";
import { EditorView } from "codemirror";
import { useQuery } from "convex/react";
import { useEffect, useMemo, useRef } from "react";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import { customSetup } from "../extensions/custom-setup";
import { getLanguageExtension } from "../extensions/languages";
import { minimap } from "../extensions/minimap";
import { suggestion } from "../extensions/suggestions";
import { customTheme } from "../extensions/theme";

export default function useFileEditorContentState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();
	const projectId = project?._id;

	const projectFileState = useFileEditorStore((state) =>
		projectId ? state.projectFileStates.get(projectId) : undefined,
	);

	const openFiles = projectFileState?.openFiles ?? [];
	const activeFileId = projectFileState?.activeFileId ?? null;
	const previewFileId = projectFileState?.previewFileId ?? null;
	const updateFileContent = useFilesUpdateContent();

	const activeFile = useQuery(
		api.files.getOwnedById,
		projectId && activeFileId ? { fileId: activeFileId } : "skip",
	);

	// Code Mirror stuff
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const editorViewRef = useRef<EditorView | null>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isApplyingExternalContentRef = useRef(false);
	const activeFileContentRef = useRef("");
	const updateFileContentRef = useRef(updateFileContent);
	const pendingSaveRef = useRef<{
		fileId: Id<"files">;
		content: string;
	} | null>(null);
	const activeFileName = activeFile?.name ?? "";
	const hasLoadedActiveFile = activeFile !== undefined;

	const languageExtension = useMemo(() => {
		return getLanguageExtension(activeFileName);
	}, [activeFileName]);

	useEffect(() => {
		activeFileContentRef.current = activeFile?.content ?? "";
	}, [activeFile?.content]);

	useEffect(() => {
		updateFileContentRef.current = updateFileContent;
	}, [updateFileContent]);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = null;
			}

			if (pendingSaveRef.current) {
				void updateFileContentRef.current(pendingSaveRef.current);
				pendingSaveRef.current = null;
			}
		};
	}, []);

	useEffect(() => {
		const container = editorContainerRef.current;

		if (!container || !activeFileId || !hasLoadedActiveFile) return;

		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = null;
		}

		pendingSaveRef.current = null;

		const scheduleSave = (content: string) => {
			pendingSaveRef.current = {
				fileId: activeFileId,
				content,
			};

			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			saveTimeoutRef.current = setTimeout(() => {
				if (!pendingSaveRef.current) return;

				void updateFileContentRef.current(pendingSaveRef.current);
				pendingSaveRef.current = null;
				saveTimeoutRef.current = null;
			}, 2000);
		};

		const flushPendingSave = () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = null;
			}

			if (pendingSaveRef.current?.fileId === activeFileId) {
				void updateFileContentRef.current(pendingSaveRef.current);
				pendingSaveRef.current = null;
			}
		};

		const view = new EditorView({
			doc: activeFileContentRef.current,
			parent: container,
			extensions: [
				customSetup,
				languageExtension,
				oneDark,
				customTheme,
				suggestion(activeFileName),
				keymap.of([indentWithTab]),
				minimap(),
				indentationMarkers(),
				EditorView.updateListener.of((update) => {
					if (
						update.docChanged &&
						!isApplyingExternalContentRef.current
					) {
						scheduleSave(update.state.doc.toString());
					}
				}),
			],
		});

		editorViewRef.current = view;

		return () => {
			flushPendingSave();
			editorViewRef.current = null;
			view.destroy();
		};
	}, [activeFileId, hasLoadedActiveFile, languageExtension, activeFileName]);

	useEffect(() => {
		if (!activeFileId || activeFile === undefined) return;

		const view = editorViewRef.current;
		if (!view) return;

		const nextContent = activeFile.content ?? "";
		const currentContent = view.state.doc.toString();

		if (currentContent === nextContent) {
			return;
		}

		if (saveTimeoutRef.current) {
			clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = null;
		}

		pendingSaveRef.current = null;

		const selection = view.state.selection.main;
		const wasFocused = view.hasFocus;

		isApplyingExternalContentRef.current = true;
		view.dispatch({
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: nextContent,
			},
			selection: {
				anchor: Math.min(selection.anchor, nextContent.length),
				head: Math.min(selection.head, nextContent.length),
			},
		});
		isApplyingExternalContentRef.current = false;

		if (wasFocused) {
			view.focus();
		}
	}, [activeFile, activeFileId]);

	return {
		project,
		openFiles,
		activeFileId,
		previewFileId,
		editorContainerRef,
		editorViewRef,
	};
}
