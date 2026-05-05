import type { Id } from "@convex/_generated/dataModel";
import useToggle from "@hooks/use-toggle";
import { useProjectsGetOwnedById } from "@/hoc/projects-getOwnedById";
import { useWebContainer } from "./use-webcontainer";

export default function usePreviewViewState() {
	const { preloadedResult: project } = useProjectsGetOwnedById();

	const { isOpen: isTerminalOpen, toggle: toggleTerminal } = useToggle(true);

	const { status, error, previewUrl, restart, terminalOutput } =
		useWebContainer({
			enabled: !!project,
			projectId: project?._id as Id<"projects">,
			settings: project?.settings,
		});

	const isLoading = status === "booting" || status === "installing";

	return {
		project,
		projectId: project?._id,
		status,
		isLoading,
		error,
		previewUrl,
		isTerminalOpen,
		toggleTerminal,
		terminalOutput,
		restart,
	};
}
