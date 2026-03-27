import { Kbd } from "@components/ui/kbd";
import Image from "next/image";
import { CTASection } from "./components/cta-section";
import { RecentProjectCard } from "./components/recent-project-card";
import RecentProjectList from "./components/recent-project-list";

export default async function ProjectsView() {
	return (
		<main className="min-h-screen flex flex-col gap-8 pt-30 max-w-wide mx-auto w-full">
			<header className="flex gap-4 items-end w-full ">
				<div className="size-19 aspect-square relative bg-foreground rounded-md border-3 border-foreground">
					<Image alt="caret" src={"/caret.png"} fill />
				</div>
				<h1 className="text-8xl font-mono font-black leading-[0.75] ">
					CARET‸
				</h1>
			</header>

			<CTASection />

			<section className="flex flex-col gap-2 w-full">
				<SectionHeader title="Last Updated" />
				<RecentProjectCard />
			</section>

			<section>
				<SectionHeader
					title="Recent Projects"
					kbd={{ kbdLabel: "View all", kbdKey: "⌘ K" }}
				/>
				<RecentProjectList renderedAt={Date.now()} />
			</section>
		</main>
	);
}

function SectionHeader({
	title,
	kbd,
}: {
	title: string;
	kbd?: { kbdLabel: string; kbdKey: string };
}) {
	return (
		<header className="w-full flex justify-center gap-2">
			<h2 className="text-muted-foreground mr-auto">{title}</h2>
			{kbd && (
				<div className="flex gap-2 items-center">
					<p className="text-muted-foreground text-sm">
						{kbd.kbdLabel}
					</p>
					<Kbd size={"sm"} variant={"outline"}>
						{kbd.kbdKey}
					</Kbd>
				</div>
			)}
		</header>
	);
}
