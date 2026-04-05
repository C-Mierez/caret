const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const DEFAULT_SIDEBAR_WIDTH = 350;
const DEFAULT_MAIN_SIZE = 1000;

import { Allotment } from "allotment";
import FileExplorer from "../explorer/file-explorer";

export default function EditorBase() {
	return (
		<div className="relative size-full">
			<Allotment
				defaultSizes={[DEFAULT_SIDEBAR_WIDTH, DEFAULT_MAIN_SIZE]}
			>
				<Allotment.Pane
					snap
					minSize={MIN_SIDEBAR_WIDTH}
					maxSize={MAX_SIDEBAR_WIDTH}
					preferredSize={DEFAULT_SIDEBAR_WIDTH}
				>
					<FileExplorer />
				</Allotment.Pane>

				<Allotment.Pane>
					<main>Main Pane</main>
				</Allotment.Pane>
			</Allotment>
		</div>
	);
}
