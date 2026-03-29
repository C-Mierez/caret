import CaretSvg from "@components/svg/caret-svg";
import { URLs } from "@lib/urls";
import Link from "next/link";
import { CTASection } from "./components/cta-section";
import RecentProjects from "./components/recent-projects";

export default async function ProjectsView() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-wide flex-col gap-8 pt-30">
			<header className="flex w-full items-end gap-4">
				<Link
					href={URLs.root}
					className="relative aspect-square size-19 rounded-md border-3 p-1.5"
				>
					<CaretSvg />
				</Link>
				<h1 className="font-black font-mono text-8xl leading-[0.75]">
					CARET‸
				</h1>
			</header>

			<CTASection />

			<RecentProjects />
		</main>
	);
}
