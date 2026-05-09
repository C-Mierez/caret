import {
	messagesCancelled,
	messagesSent,
} from "@modules/conversation/inngest/functions";
import {
	githubExport,
	githubExportCancelled,
} from "@modules/projects/inngest/functions/export";
import {
	githubImport,
	githubImportCancelled,
} from "@modules/projects/inngest/functions/import";
import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
	client: inngest,
	functions: [
		messagesCancelled,
		messagesSent,
		githubExport,
		githubExportCancelled,
		githubImport,
		githubImportCancelled,
	],
});
