import { ChevronDownIcon, ChevronRightIcon, Loader2Icon } from "lucide-react";

export default function TogglableChevron({
	isOpen,
	isLoading = false,
}: {
	isOpen: boolean;
	isLoading?: boolean;
}) {
	if (isLoading) {
		return <Loader2Icon className="size-4 animate-spin" />;
	}

	return (
		<>
			{isOpen ? (
				<ChevronDownIcon className="size-4" />
			) : (
				<ChevronRightIcon className="size-4" />
			)}
		</>
	);
}
