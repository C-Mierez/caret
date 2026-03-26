import Firecrawl from "@mendable/firecrawl-js";
import { env } from "@/env";

export const firecrawl = new Firecrawl({
	apiKey: env.FIRECRAWL_API_KEY,
});
