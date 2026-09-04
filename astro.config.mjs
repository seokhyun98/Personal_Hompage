import { readFileSync } from "node:fs";

import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

const SITE_ORIGIN = "https://seokhyunhwang.com";
const publicationPdfData = JSON.parse(
	readFileSync(
		new URL("./src/collections/publication-pdfs.json", import.meta.url),
		"utf8",
	),
);
const publicationPdfUrls = publicationPdfData.entries.map(({ path }) =>
	new URL(path, SITE_ORIGIN).toString(),
);

// https://astro.build/config
export default defineConfig({
	site: SITE_ORIGIN,
	integrations: [
		tailwind(),
		sitemap({
			customPages: publicationPdfUrls,
			filter: (page) => {
				const pathname = new URL(page).pathname;
				const excludedHtmlRoutes = new Set([
					"/about/",
					"/projects/",
					"/posts/",
				]);
				const isMachineReadableExport = /\.(?:bib|json|ris|txt|xml)$/i.test(
					pathname,
				);

				return !excludedHtmlRoutes.has(pathname) && !isMachineReadableExport;
			},
		}),
	],
});
