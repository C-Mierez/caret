import Image from "next/image";
import { CTASection } from "./components/cta-section";
import RecentProjects from "./components/recent-projects";

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

			<RecentProjects />
		</main>
	);
}
