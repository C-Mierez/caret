import { describe, expect, it } from "bun:test";
import { sortGithubTree } from "../github-utils";

describe("sortGithubTree", () => {
	it("orders parents before children", () => {
		const input = [
			{ path: "dir1/subdir1" },
			{ path: "dir1" },
			{ path: "dir1/subdir1/file" },
		];

		const out = sortGithubTree(input);

		expect(out.map((i) => i.path)).toEqual([
			"dir1",
			"dir1/subdir1",
			"dir1/subdir1/file",
		]);
	});

	it("is stable and deterministic for siblings", () => {
		const input = [{ path: "b" }, { path: "a" }, { path: "b/a" }];
		const out = sortGithubTree(input);
		expect(out.map((i) => i.path)).toEqual(["a", "b", "b/a"]);
	});

	it("does not mutate the original array", () => {
		const input = [{ path: "x/y" }, { path: "x" }];
		const copy = [...input];
		void sortGithubTree(input);
		expect(input).toEqual(copy);
	});
});
