import { createTool } from "@inngest/agent-kit";
import { z } from "zod";
import { firecrawl } from "@/lib/firecrawl";

const schema = z.object({
	url: z.string().url("A valid URL must be provided"),
});

export const scrapeUrls = createTool({
	name: "scrape-urls",
	description:
		"Scrape a web page with Firecrawl and return its markdown content.",
	parameters: schema,
	async handler(input, { step }) {
		try {
			return await step?.run("scrape-urls", async () => {
				const result = await firecrawl.scrape(input.url, {
					formats: ["markdown"],
				});

				if (!result.markdown) {
					return "Error: No markdown content could be scraped from the provided URL.";
				}

				return result.markdown;
			});
		} catch (e) {
			return `Error scraping URL: ${e instanceof Error ? e.message : String(e)}`;
		}
	},
});
