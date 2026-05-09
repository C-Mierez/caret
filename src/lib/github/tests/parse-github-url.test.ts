import { describe, expect, it } from "bun:test";
import { parseGithubUrl } from "../github-utils";

describe("parseGithubUrl", () => {
	it("parses https URL without .git", () => {
		expect(parseGithubUrl("https://github.com/owner/repo")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	it("parses https URL with .git and trailing slash", () => {
		expect(parseGithubUrl("https://github.com/owner/repo.git/")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	it("parses www.github.com", () => {
		expect(parseGithubUrl("https://www.github.com/owner/repo")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	it("parses ssh scp-style URL", () => {
		expect(parseGithubUrl("git@github.com:owner/repo.git")).toEqual({
			owner: "owner",
			repo: "repo",
		});
	});

	it("parses repo names containing dots", () => {
		expect(parseGithubUrl("https://github.com/owner/my.repo.git")).toEqual({
			owner: "owner",
			repo: "my.repo",
		});
	});

	it("throws for non-github hosts", () => {
		expect(() => parseGithubUrl("https://gitlab.com/owner/repo")).toThrow();
	});

	it("throws for invalid strings", () => {
		expect(() => parseGithubUrl("not a url")).toThrow();
	});
});
