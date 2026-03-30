"use client";

import type { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { createContext, useContext } from "react";

interface ProjectsDataContextType {
	preloadedResult: Doc<"projects">;
}

const ProjectsDataContext = createContext<ProjectsDataContextType | undefined>(
	undefined,
);

interface Props {
	project: Preloaded<typeof api.projects.getOwnedById>;
	children: React.ReactNode;
}

export default function ProjectsGetOwnedById({ project, children }: Props) {
	const preloadedResult = usePreloadedQuery(project);

	const value: ProjectsDataContextType = {
		preloadedResult,
	};

	return (
		<ProjectsDataContext.Provider value={value}>
			{children}
		</ProjectsDataContext.Provider>
	);
}

export function useProjectsGetOwnedById() {
	const context = useContext(ProjectsDataContext);
	if (context === undefined) {
		throw new Error(
			"useProjectsGetOwnedById must be used within ProjectsGetOwnedById provider",
		);
	}
	return context;
}
