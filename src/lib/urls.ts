export const URLs = {
	root: "/",
	signIn: "/sign-in",
	signUp: "/sign-up",
	projects: "/projects",
};

export function buildProjectUrl(projectId: string) {
	return `${URLs.projects}/${projectId}`;
}
