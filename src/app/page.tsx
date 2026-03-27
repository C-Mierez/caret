import { withProjectsGetOwnedInfinite } from "@/hoc/with-projects-getOwnedInfinite";
import ProjectsView from "../modules/projects/ui/projects-view";

function Home() {
	return <ProjectsView />;
}

export default withProjectsGetOwnedInfinite(Home);
