export const URLs = {
	root: "/",
	signIn: "/sign-in",
	projects: "/projects",
};

export function buildProjectUrl(projectId: string) {
	return `${URLs.projects}/${projectId}`;
}
