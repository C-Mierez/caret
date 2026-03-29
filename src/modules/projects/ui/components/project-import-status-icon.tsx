import type { Doc } from "@convex/_generated/dataModel";
import { cn } from "@lib/utils";
import {
	AlertCircleIcon,
	CircleSlashIcon,
	GlobeIcon,
	Loader2Icon,
} from "lucide-react";
import { FaGithub } from "react-icons/fa";

interface Props {
	status: Doc<"projects">["importStatus"];
	className?: string;
}

export default function ProjectImportStatusIcon({ status, className }: Props) {
	switch (status) {
		case "not_started":
			return <GlobeIcon className={className} />;
		case "importing":
			return <Loader2Icon className={cn(className, "animate-spin")} />;
		case "failed":
			return <AlertCircleIcon className={className} />;
		case "completed":
			return <FaGithub className={className} />;
		case "canceled":
			return <CircleSlashIcon className={className} />;
	}
}
