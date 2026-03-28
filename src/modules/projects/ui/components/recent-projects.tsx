"use client";

import useModal from "@hooks/use-modal";
import ProjectsSectionHeader from "./projects-section-header";
import { RecentProjectCard } from "./recent-project-card";
import RecentProjectList from "./recent-project-list";

export default function RecentProjects() {
	const cmdDialog = useModal();

	return (
		<>
			<section className="flex flex-col gap-2 w-full">
				<ProjectsSectionHeader title="Last Updated" />
				<RecentProjectCard />
			</section>

			<section>
				<ProjectsSectionHeader
					title="Recent Projects"
					kbdProps={{
						kbdLabel: "View all",
						kbdKey: "k",
						kbdKeyLabel: "K",
						onTrigger: () => {
							cmdDialog.openModal();
						},
						asButton: true,
					}}
				/>
				<RecentProjectList
					renderedAt={Date.now()}
					modalProps={cmdDialog}
				/>
			</section>
		</>
	);
}
