"use client";

import { useAuth } from "@clerk/nextjs";
import type { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { createContext, useContext } from "react";

interface ProjectsDataContextType {
	preloadedResult: Doc<"projects"> | null;
}

const ProjectsDataContext = createContext<ProjectsDataContextType | undefined>(
	undefined,
);

interface Props {
	project: Preloaded<typeof api.projects.getOwnedById>;
	children: React.ReactNode;
}

function SignedInProjectsGetOwnedById({ project, children }: Props) {
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

export default function ProjectsGetOwnedById({ project, children }: Props) {
	const { isLoaded, isSignedIn } = useAuth();

	if (!isLoaded || !isSignedIn) {
		return (
			<ProjectsDataContext.Provider value={{ preloadedResult: null }}>
				{children}
			</ProjectsDataContext.Provider>
		);
	}

	return (
		<SignedInProjectsGetOwnedById project={project}>
			{children}
		</SignedInProjectsGetOwnedById>
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
