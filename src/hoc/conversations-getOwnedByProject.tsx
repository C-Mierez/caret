"use client";

import type { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { type Preloaded, usePreloadedQuery } from "convex/react";
import { createContext, useContext } from "react";

interface ConversationsDataContextType {
	preloadedResult: Doc<"conversations">[];
}

const ConversationsDataContext = createContext<
	ConversationsDataContextType | undefined
>(undefined);

interface Props {
	initialConversations: Preloaded<typeof api.conversations.getOwnedByProject>;
	children: React.ReactNode;
}

export default function ConversationsGetOwnedByProject({
	initialConversations,
	children,
}: Props) {
	const preloadedResult = usePreloadedQuery(initialConversations);

	const value: ConversationsDataContextType = {
		preloadedResult,
	};

	return (
		<ConversationsDataContext.Provider value={value}>
			{children}
		</ConversationsDataContext.Provider>
	);
}

export function useConversationsGetOwnedByProject() {
	const context = useContext(ConversationsDataContext);
	if (context === undefined) {
		throw new Error(
			"useConversationsGetOwnedByProject must be used within ConversationsGetOwnedByProject provider",
		);
	}
	return context;
}
