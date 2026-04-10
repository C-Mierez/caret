const MIN_SIDEBAR_WIDTH = 200;
const MAX_SIDEBAR_WIDTH = 800;
const DEFAULT_SIDEBAR_WIDTH = 350;
const DEFAULT_MAIN_SIZE = 1000;

import FileExplorerView from "@modules/file-explorer/ui/file-explorer-view";
import { Allotment } from "allotment";
import FileEditor from "./components/file-editor";

export default function FileEditorView() {
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
					<FileExplorerView />
				</Allotment.Pane>

				<Allotment.Pane>
					<FileEditor />
				</Allotment.Pane>
			</Allotment>
		</div>
	);
}
