import "server-only";

import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { preloadQuery } from "convex/nextjs";
import ConversationsGetOwnedByProject from "../conversations-getOwnedByProject";
import type { ServerComponent } from "./types";
import { createProtectedDataHoc } from "./utils";

interface Props {
	params: Promise<{
		projectId: string;
	}>;
}

export function withConversationsGetOwnedByProject<P extends Props>(
	Component: ServerComponent<P>,
) {
	return createProtectedDataHoc<P, Awaited<ReturnType<typeof preloadQuery>>>({
		errorMessage: "Error fetching conversations:",
		getData: async (props, token) => {
			const { projectId } = await props.params;

			return preloadQuery(
				api.conversations.getOwnedByProject,
				{ projectId: projectId as Id<"projects"> },
				{ token },
			);
		},
		render: ({ props, data: initialConversations, Component }) => (
			<ConversationsGetOwnedByProject
				initialConversations={initialConversations}
			>
				<Component {...props} />
			</ConversationsGetOwnedByProject>
		),
	})(Component);
}
