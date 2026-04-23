import AllotmentWrapper from "../components/layout/allotment-wrapper";
import ProjectsIdHeader from "../components/layout/projects-id-header";

interface Props {
	children: React.ReactNode;
	projectId: string;
}

export default async function ProjectsIdLayout({ children, projectId }: Props) {
	return (
		<>
			<ProjectsIdHeader />
			<div className="h-[calc(100dvh-var(--spacing-header))] w-full">
				<AllotmentWrapper projectId={projectId}>
					{children}
				</AllotmentWrapper>
			</div>
		</>
	);
}
