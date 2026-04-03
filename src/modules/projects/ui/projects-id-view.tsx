"use client";

import type { Id } from "@convex/_generated/dataModel";
import { cn } from "@lib/utils";
import { useMemo, useState } from "react";
import { FaGithub } from "react-icons/fa";
import EditorBase from "./components/editor/editor-base";

interface TabProps {
	label: "Code" | "Preview";
	isActive: boolean;
	onClick: () => void;
}

function Tab({ label, isActive, onClick }: TabProps) {
	return (
		// Align the last element to the right
		<li className="h-full">
			<button
				type="button"
				onClick={onClick}
				className={cn(
					"flex h-full items-center gap-2 border-border border-r-2 px-6 text-sm",
					isActive && "bg-muted-alt text-foreground",
					!isActive && "hover:bg-muted hover:text-foreground",
				)}
			>
				{label}
			</button>
		</li>
	);
}

interface Props {
	projectId: Id<"projects">;
}

export default function ProjectsIdView({ projectId }: Props) {
	const [activeTab, setActiveTab] = useState<TabProps["label"]>("Code");

	const tabs = useMemo(
		() =>
			[
				{
					label: "Code",
					isActive: activeTab === "Code",
					onClick: () => {
						setActiveTab("Code");
					},
				},
				{
					label: "Preview",
					isActive: activeTab === "Preview",
					onClick: () => {
						setActiveTab("Preview");
					},
				},
			] satisfies TabProps[],
		[activeTab],
	);

	return (
		<div className="h-full">
			<nav>
				<ul className="flex h-subheader items-center border-b-2 border-b-border bg-background text-muted-foreground">
					{tabs.map((tab) => (
						<Tab key={`${tab.label}`} {...tab} />
					))}

					<li className="ml-auto h-full">
						<button
							type="button"
							className={
								"flex h-full items-center gap-2 border-border border-l-2 px-6 text-sm hover:bg-muted hover:text-foreground"
							}
						>
							<FaGithub className="size-4" />
							<span>Export</span>
						</button>
					</li>
				</ul>
			</nav>
			{activeTab === "Code" && <EditorBase />}
		</div>
	);
}
