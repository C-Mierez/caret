export type GithubTreeItem = {
	path: string;
	type?: string;
	sha?: string;
};

export type GithubFileBlob = {
	sha: string;
	size: number;
	content: string;
	encoding: string;
};
