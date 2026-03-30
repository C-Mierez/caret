"use client";

import { useEffect } from "react";
import { Kbd } from "./ui/kbd";

type Key = "k" | "j" | "i";

interface Props {
	kbdLabel?: string;
	kbdKeyLabel: string;
	kbdKey: Key;
	onTrigger: () => void;
	asButton?: boolean;
}

export default function CommandKbd({
	kbdLabel,
	kbdKeyLabel,
	kbdKey,
	onTrigger,
	asButton = false,
}: Props) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			const target = e.target as HTMLElement | null;

			// Don't trigger if the user is typing in an input, textarea, select, or contenteditable element
			if (
				target?.closest(
					"input, textarea, select, [contenteditable='true']",
				)
			) {
				return;
			}

			if (
				(e.metaKey || e.ctrlKey) &&
				e.key.toLowerCase() === kbdKey.toLowerCase()
			) {
				e.preventDefault();
				onTrigger();
			}
		};

		document.addEventListener("keydown", handleKeyDown);

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
		};
	}, [onTrigger, kbdKey]);

	const Slot = asButton ? "button" : "div";

	return (
		<Slot
			type="button"
			className="group flex items-center gap-2"
			onClick={onTrigger}
		>
			{!!kbdLabel && (
				<p className="text-muted-foreground text-sm group-hover:text-foreground">
					{kbdLabel}
				</p>
			)}
			<Kbd size={"sm"} variant={"outline"}>
				{`⌘ ${kbdKeyLabel}`}
			</Kbd>
		</Slot>
	);
}
