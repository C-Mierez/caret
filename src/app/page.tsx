import { composeServerHocs } from "../hoc/server/utils";
import { withProjectsGetOwnedAll } from "../hoc/server/with-projects-getOwnedAll";
import { withProjectsGetOwnedInfinite } from "../hoc/server/with-projects-getOwnedInfinite";
import ProjectsView from "../modules/projects/ui/projects-view";

function Home() {
	return <ProjectsView />;
}

const withProjectData = composeServerHocs(
	withProjectsGetOwnedInfinite,
	withProjectsGetOwnedAll,
);

export default withProjectData(Home);
