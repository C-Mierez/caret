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
import { customTheme } from "../extensions/theme";

export default function useFileEditorContentState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	const projectFileState = useFileEditorStore((state) =>
		state.projectFileStates.get(project._id),
	);

	const openFiles = projectFileState?.openFiles ?? [];
	const activeFileId = projectFileState?.activeFileId ?? null;
	const previewFileId = projectFileState?.previewFileId ?? null;
	const updateFileContent = useFilesUpdateContent();

	const activeFile = useQuery(
		api.files.getOwnedById,
		activeFileId ? { fileId: activeFileId } : "skip",
	);

	// Code Mirror stuff
	const editorContainerRef = useRef<HTMLDivElement | null>(null);
	const editorViewRef = useRef<EditorView | null>(null);
	const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const isApplyingExternalContentRef = useRef(false);
	const pendingSaveRef = useRef<{
		fileId: Id<"files">;
		content: string;
	} | null>(null);
	const activeFileName = activeFile?.name ?? "";

	const languageExtension = useMemo(() => {
		return getLanguageExtension(activeFileName);
	}, [activeFileName]);

	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
				saveTimeoutRef.current = null;
			}

			if (pendingSaveRef.current) {
				void updateFileContent(pendingSaveRef.current);
				pendingSaveRef.current = null;
			}
		};
	}, [updateFileContent]);

	useEffect(() => {
		const container = editorContainerRef.current;

		if (!container || !activeFileId) return;

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

				void updateFileContent(pendingSaveRef.current);
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
				void updateFileContent(pendingSaveRef.current);
				pendingSaveRef.current = null;
			}
		};

		const view = new EditorView({
			doc: "",
			parent: container,
			extensions: [
				customSetup,
				languageExtension,
				oneDark,
				customTheme,
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
	}, [activeFileId, languageExtension, updateFileContent]);

	useEffect(() => {
		if (!activeFileId || activeFile === undefined) return;

		const view = editorViewRef.current;
		if (!view) return;

		const nextContent = activeFile.content ?? "";
		const currentContent = view.state.doc.toString();

		if (currentContent === nextContent) {
			return;
		}

		isApplyingExternalContentRef.current = true;
		view.dispatch({
			changes: {
				from: 0,
				to: view.state.doc.length,
				insert: nextContent,
			},
		});
		isApplyingExternalContentRef.current = false;
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
