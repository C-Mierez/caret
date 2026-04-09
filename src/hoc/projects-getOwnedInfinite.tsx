"use client";

import { useAuth } from "@clerk/nextjs";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { DEFAULT_PROJECTS_LIMIT } from "@lib/constants";
import {
	type UsePaginatedQueryReturnType,
	usePaginatedQuery,
	useQuery,
} from "convex/react";
import type { PaginationResult } from "convex/server";
import { createContext, useContext } from "react";

interface ProjectsDataContextType {
	paginatedResult: UsePaginatedQueryReturnType<
		typeof api.projects.getOwnedInfinite
	>;
	totalProjects: number;
	featuredProject: Doc<"projects"> | null;
	recentProjects: Doc<"projects">[];
}

const ProjectsDataContext = createContext<ProjectsDataContextType | undefined>(
	undefined,
);

interface Props {
	initialData: PaginationResult<Doc<"projects">>;
	initialTotalProjects: number;
	children: React.ReactNode;
}

export default function ProjectsGetOwnedInfinite({
	initialData,
	initialTotalProjects,
	children,
}: Props) {
	const { isLoaded, isSignedIn } = useAuth();
	const shouldQuery = isLoaded && isSignedIn;

	const paginatedResult = usePaginatedQuery(
		api.projects.getOwnedInfinite,
		shouldQuery ? {} : "skip",
		{ initialNumItems: DEFAULT_PROJECTS_LIMIT },
	);
	const reactiveTotalProjects = useQuery(
		api.projects.getOwnedCount,
		shouldQuery ? {} : "skip",
	);
	const totalProjects = reactiveTotalProjects ?? initialTotalProjects;

	const projects =
		paginatedResult.results.length > 0 ||
		paginatedResult.status !== "LoadingFirstPage"
			? paginatedResult.results
			: initialData.page;

	const featuredProject = projects[0] ?? null;
	const recentProjects = projects.slice(1);

	const value: ProjectsDataContextType = {
		paginatedResult,
		totalProjects,
		featuredProject,
		recentProjects,
	};

	return (
		<ProjectsDataContext.Provider value={value}>
			{children}
		</ProjectsDataContext.Provider>
	);
}

export function useProjectsGetOwnedInfinite() {
	const context = useContext(ProjectsDataContext);
	if (context === undefined) {
		throw new Error(
			"useProjectsGetOwnedInfinite must be used within ProjectsGetOwnedInfinite provider",
		);
	}
	return context;
}
