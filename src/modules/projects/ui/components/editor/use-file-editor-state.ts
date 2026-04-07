import { useFileEditorStore } from "@modules/projects/stores/use-file-editor-store";

export default function useFileEditorState() {
	const closeAllFiles = useFileEditorStore((state) => state.closeAllFiles);
	return { closeAllFiles };
}
