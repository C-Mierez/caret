import ProjectsIdLayout from "@modules/projects/ui/layouts/projects-id-layout";
import { composeServerHocs } from "@/hoc/server/utils";
import { withConversationsGetOwnedByProject } from "@/hoc/server/with-conversations-getOwnedByProject";
import { withProjectsGetOwnedById } from "@/hoc/server/with-projects-getOwnedById";

interface Props {
	params: Promise<{
		projectId: string;
	}>;
	children: React.ReactNode;
}

async function Layout({ children, params }: Props) {
	const { projectId } = await params;
	return (
		<ProjectsIdLayout projectId={projectId}>{children}</ProjectsIdLayout>
	);
}

export default composeServerHocs(
	withProjectsGetOwnedById,
	withConversationsGetOwnedByProject,
)(Layout);
