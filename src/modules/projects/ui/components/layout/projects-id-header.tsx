import { UserButton } from "@clerk/nextjs";
import CaretSvg from "@components/svg/caret-svg";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
} from "@components/ui/breadcrumb";
import { URLs } from "@lib/urls";
import Link from "next/link";
import BreadcrumbEditable from "./breadcrumb-editable";
import BreadcrumbStatus from "./breadcrumb-status";

export default function ProjectsIdHeader() {
	return (
		<header className="sticky top-0 right-0 left-0 z-50 flex h-header items-center border-2 border-b-border bg-background">
			<Link
				href={URLs.root}
				className="group relative aspect-square h-full border-r-2 border-r-border p-2"
			>
				<CaretSvg />
			</Link>
			<nav className="flex h-full flex-1 items-center gap-2 p-2">
				<div className="flex flex-1 items-center gap-[1ch] font-mono text-sm">
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem>
								<BreadcrumbEditable />
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>

					<BreadcrumbStatus />
				</div>

				<UserButton />
			</nav>
		</header>
	);
}
