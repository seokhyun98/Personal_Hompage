import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
	const sitemapUrl = site
		? new URL("sitemap-index.xml", site).href
		: "https://www.seokhyunhwang.com/sitemap-index.xml";

	const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`.trim();

	return new Response(robotsTxt, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
};
