export const URLs = {
	root: "/",
	signIn: "/sign-in",
	projects: "/projects",
};

export function buildProjectUrl(projectId: string) {
	return `${URLs.projects}/${projectId}`;
}

export const API_URLS = {
	messages: {
		create: "/api/ai/messages",
		cancel: "/api/ai/messages/cancel",
	},
};
