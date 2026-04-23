"use client";

import ConversationPanel from "@modules/conversation/ui/conversation-panel";
import { Allotment } from "allotment";
import "allotment/dist/style.css";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const DEFAULT_CONVERSATION_SIDEBAR_WIDTH = 400;
const DEFAULT_MAIN_SIZE = 1000;

interface Props {
	projectId: string;
	children: React.ReactNode;
}

export default function AllotmentWrapper({ projectId, children }: Props) {
	return (
		<Allotment
			className="w-full"
			defaultSizes={[
				DEFAULT_CONVERSATION_SIDEBAR_WIDTH,
				DEFAULT_MAIN_SIZE,
			]}
		>
			<Allotment.Pane
				className="w-full"
				snap
				minSize={MIN_SIDEBAR_WIDTH}
				maxSize={MAX_SIDEBAR_WIDTH}
				preferredSize={DEFAULT_CONVERSATION_SIDEBAR_WIDTH}
			>
				<ConversationPanel projectId={projectId} />
			</Allotment.Pane>

			<Allotment.Pane>{children}</Allotment.Pane>
		</Allotment>
	);
}
