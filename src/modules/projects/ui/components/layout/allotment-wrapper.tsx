"use client";

import { Allotment } from "allotment";
import "allotment/dist/style.css";

const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const DEFAULT_CONVERSATION_SIDEBAR_WIDTH = 400;
const DEFAULT_MAIN_SIZE = 1000;

export default function AllotmentWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
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
				<div>Conversation Pane</div>
			</Allotment.Pane>

			<Allotment.Pane>{children}</Allotment.Pane>
		</Allotment>
	);
}
