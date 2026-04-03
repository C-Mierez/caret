import type { Id } from "@convex/_generated/dataModel";
import { useEffect, useRef } from "react";

interface Options {
	activeEntryId: Id<"files"> | undefined;
	onClearSelection: () => void;
}

export default function useFileTreeInteractions({
	activeEntryId,
	onClearSelection,
}: Options) {
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		const onContainerClick = (event: MouseEvent) => {
			if (event.target === container && activeEntryId) {
				onClearSelection();
			}
		};

		const onWindowKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "Escape" || !activeEntryId) return;

			const focusedElement = document.activeElement;
			if (focusedElement && container.contains(focusedElement)) {
				event.preventDefault();
				onClearSelection();
			}
		};

		container.addEventListener("click", onContainerClick);
		window.addEventListener("keydown", onWindowKeyDown);

		return () => {
			container.removeEventListener("click", onContainerClick);
			window.removeEventListener("keydown", onWindowKeyDown);
		};
	}, [activeEntryId, onClearSelection]);

	return {
		containerRef,
	};
}
