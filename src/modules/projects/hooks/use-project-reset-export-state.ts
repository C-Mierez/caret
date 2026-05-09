import { api } from "@convex/_generated/api";
import { useMutation } from "convex/react";

export default function useProjectResetExportState() {
	return useMutation(api.user.projects.resetExportState);
}
