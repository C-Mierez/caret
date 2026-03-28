"use client";

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@components/ui/command";
import type { ModalProps } from "@hooks/use-modal";
import { buildProjectUrl } from "@lib/urls";
import { useRouter } from "next/navigation";
import { useProjectsGetOwnedAll } from "@/hoc/projects-getOwnedAll";

interface Props extends ModalProps {}

export default function ProjectsCommandDialog(props: Props) {
	const router = useRouter();

	const { preloadedResult } = useProjectsGetOwnedAll();

	const handleSelect = (projectId: string) => {
		router.push(buildProjectUrl(projectId));
		props.closeModal();
	};

	return (
		<CommandDialog
			open={props.isOpen}
			onOpenChange={props.onOpenChange}
			title="Search Projects"
			description="Search and navigate your projects"
		>
			<CommandInput placeholder="Search projects..." />
			<CommandList>
				<CommandEmpty>No projects found.</CommandEmpty>
				<CommandGroup heading="Projects">
					{preloadedResult.map((project) => (
						<CommandItem
							key={project._id}
							value={`${project.name}-${project._id}`}
							onSelect={() => handleSelect(project._id)}
						>
							<span>{project.name}</span>
						</CommandItem>
					))}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}
