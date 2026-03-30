import ProjectsIdHeader from "../components/layout/projects-id-header";

interface Props {
	children: React.ReactNode;
}

export default async function ProjectsIdLayout({ children }: Props) {
	return (
		<>
			<ProjectsIdHeader />
			<div className="flex">
				<div className="sticky top-header left-0 z-50 h-[calc(100vh-(var(--spacing-header)))] w-sidebar overflow-y-auto bg-amber-300"></div>
				<div className="flex-1">{children}</div>
			</div>
		</>
	);
}
