import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
	const sitemapUrl = site
		? new URL("sitemap-index.xml", site).href
		: "https://seokhyunhwang.com/sitemap-index.xml";

	const searchCrawlerRules = [
		"OAI-SearchBot",
		"ChatGPT-User",
		"Claude-SearchBot",
		"Claude-User",
		"PerplexityBot",
		"Perplexity-User",
	]
		.map((userAgent) => `User-agent: ${userAgent}\nAllow: /`)
		.join("\n\n");

	const robotsTxt = `${searchCrawlerRules}

User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`.trim();

	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
