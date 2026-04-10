import { useFileEditorStore } from "@modules/file-editor/stores/use-file-editor-store";

export default function useFileEditorState() {
	const closeAllFiles = useFileEditorStore((state) => state.closeAllFiles);
	return { closeAllFiles };
}
