"use client";

import useModal from "@hooks/use-modal";
import { useRef } from "react";
import ProjectsSectionHeader from "./projects-section-header";
import { RecentProjectCard } from "./recent-project-card";
import RecentProjectList from "./recent-project-list";

export default function RecentProjects() {
	const cmdDialog = useModal();

	const renderedAt = useRef(Date.now()).current;

	return (
		<>
			<section className="flex w-full flex-col gap-2">
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
					renderedAt={renderedAt}
					modalProps={cmdDialog}
				/>
			</section>
		</>
	);
}
