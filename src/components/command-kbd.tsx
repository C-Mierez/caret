"use client";

import { useEffect } from "react";
import { Kbd } from "./ui/kbd";

type Key = "k" | "j" | "i";

interface Props {
	kbdLabel?: string;
	kbdKeyLabel: string;
	kbdKey: Key;
	onTrigger: () => void;
}

export default function CommandKbd({
	kbdLabel,
	kbdKeyLabel,
	kbdKey,
	onTrigger,
}: Props) {
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
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

	return (
		<button
			type="button"
			className="flex gap-2 items-center"
			onClick={onTrigger}
		>
			{!!kbdLabel && (
				<p className="text-muted-foreground text-sm">{kbdLabel}</p>
			)}
			<Kbd size={"sm"} variant={"outline"}>
				{`⌘ ${kbdKeyLabel}`}
			</Kbd>
		</button>
	);
}
