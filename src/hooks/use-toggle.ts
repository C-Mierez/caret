import { useState } from "react";

export default function useToggle(initialValue: boolean = false) {
	const [isOpen, setIsOpen] = useState(initialValue);

	const toggle = () => setIsOpen((prev) => !prev);

	return { isOpen, setIsOpen, toggle };
}
