import ProjectsIdLayout from "@modules/projects/ui/layouts/projects-id-layout";
import { composeServerHocs } from "@/hoc/server/utils";
import { withProjectsGetOwnedById } from "@/hoc/server/with-projects-getOwnedById";

interface Props {
	params: Promise<{
		projectId: string;
	}>;
	children: React.ReactNode;
}

async function Layout({ children }: Props) {
	return <ProjectsIdLayout>{children}</ProjectsIdLayout>;
}

export default composeServerHocs(withProjectsGetOwnedById)(Layout);
