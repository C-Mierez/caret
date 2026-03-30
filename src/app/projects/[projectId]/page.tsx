import type { Id } from "@convex/_generated/dataModel";
import ProjectsIdView from "@modules/projects/ui/projects-id-view";

interface Props {
	params: Promise<{
		projectId: string;
	}>;
}

export default async function ProjectsIdPage({ params }: Props) {
	const { projectId } = await params; // Layout should have already fetched the project, so this should be safe to cast

	return <ProjectsIdView projectId={projectId as Id<"projects">} />;
}
