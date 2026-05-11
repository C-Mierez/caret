export function parseGithubUrl(url: string) {
	try {
		const u = new URL(url);
		const host = u.hostname.toLowerCase();
		if (host !== "github.com" && host !== "www.github.com") {
			throw new Error("Not a GitHub URL");
		}
		const parts = u.pathname.replace(/^\/+|\/+$/g, "").split("/");
		if (parts.length < 2) throw new Error("Invalid GitHub URL");
		const owner = parts[0];
		let repo = parts[1];
		if (repo.endsWith(".git")) repo = repo.slice(0, -4);
		return { owner, repo };
	} catch (_) {
		const match = url.match(
			/github\.com[:/](?:([^/]+)\/([^/]+?))(?:\.git)?\/?$/i,
		);
		if (!match) {
			throw new Error("Invalid GitHub URL");
		}
		const owner = match[1];
		let repo = match[2];
		if (repo.endsWith(".git")) repo = repo.slice(0, -4);
		return { owner, repo };
	}
}

// Used to sort the tree fetched from Github so that the parent directories are always before their children.
export function sortGithubTree<T extends { path: string }>(entries: T[]): T[] {
	const copy = [...entries];

	function depth(p: string) {
		return p.split("/").filter(Boolean).length;
	}

	copy.sort((a, b) => {
		const da = depth(a.path);
		const db = depth(b.path);
		if (da !== db) return da - db;
		return a.path.localeCompare(b.path);
	});

	return copy;
}
