import AllotmentWrapper from "../components/layout/allotment-wrapper";
import ProjectsIdHeader from "../components/layout/projects-id-header";

interface Props {
	children: React.ReactNode;
}

export default async function ProjectsIdLayout({ children }: Props) {
	return (
		<>
			<ProjectsIdHeader />
			<div className="h-[calc(100dvh-var(--spacing-header))] w-full">
				<AllotmentWrapper>{children}</AllotmentWrapper>
			</div>
		</>
	);
}
