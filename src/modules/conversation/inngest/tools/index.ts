import { createFiles } from "./create-files";
import { createFolder } from "./create-folder";
import { deleteFiles } from "./delete-files";
import { listFiles } from "./list-files";
import { readFiles } from "./read-files";
import { renameFile } from "./rename-file";
import { scrapeUrls } from "./scrape-urls";
import { updateFile } from "./update-file";

export const Tools = {
	readFiles,
	listFiles,
	createFiles,
	createFolder,
	deleteFiles,
	scrapeUrls,
	updateFile,
	renameFile,
};
