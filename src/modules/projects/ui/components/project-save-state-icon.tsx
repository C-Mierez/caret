import { cn } from "@lib/utils";
import { CheckCircleIcon, Loader2Icon } from "lucide-react";

interface Props {
	isSaving: boolean;
	className?: string;
}

export default function ProjectSaveStateIcon({ isSaving, className }: Props) {
	if (!isSaving) {
		return <CheckCircleIcon className={cn(className, "opacity-50")} />;
	}

	return <Loader2Icon className={cn(className, "animate-spin")} />;
}
