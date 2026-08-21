import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://seokhyunhwang.com",
	integrations: [
		tailwind(),
		sitemap({
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
