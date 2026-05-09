import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import { getMachineConvexClient } from "@lib/server/convex";

export async function updateProjectStatus(options: {
	projectId: string;
	payload:
		| {
				type: "import";
				status: Doc<"projects">["importStatus"];
		  }
		| {
				type: "export";
				status: Doc<"projects">["exportStatus"];
				repoUrl?: string | null;
				description?: string;
				visibility?: "private" | "public";
		  };
}) {
	const { mintServiceToken } = await import("@lib/server/service-token");
	const serviceToken = await mintServiceToken("inngest-project-worker");
	const convexClient = await getMachineConvexClient(serviceToken);

	if (options.payload.type === "import") {
		await convexClient.mutation(api.system.projects.updateImportStatus, {
			projectId: options.projectId as Id<"projects">,
			importStatus: options.payload.status,
		});
		return;
	}

	await convexClient.mutation(api.system.projects.updateExportStatus, {
		projectId: options.projectId as Id<"projects">,
		exportStatus: options.payload.status,
		exportRepoUrl: options.payload.repoUrl ?? undefined,
		exportDescription: options.payload.description,
		exportVisibility: options.payload.visibility,
	});
}
