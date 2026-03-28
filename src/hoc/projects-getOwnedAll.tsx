"use client";

import type { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { createContext, useContext } from "react";

interface ProjectsDataContextType {
	preloadedResult: Doc<"projects">[];
}

const ProjectsDataContext = createContext<ProjectsDataContextType | undefined>(
	undefined,
);

interface Props {
	initialProjects: Preloaded<typeof api.projects.getOwnedAll>;
	children: React.ReactNode;
}

export default function ProjectsGetOwnedAll({
	initialProjects,
	children,
}: Props) {
	const preloadedResult = usePreloadedQuery(initialProjects);

	const value: ProjectsDataContextType = {
		preloadedResult,
	};

	return (
		<ProjectsDataContext.Provider value={value}>
			{children}
		</ProjectsDataContext.Provider>
	);
}

export function useProjectsGetOwnedAll() {
	const context = useContext(ProjectsDataContext);
	if (context === undefined) {
		throw new Error(
			"useProjectsGetOwnedAll must be used within ProjectsGetOwnedAll provider",
		);
	}
	return context;
}
