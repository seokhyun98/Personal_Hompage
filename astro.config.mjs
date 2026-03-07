import { defineConfig } from "astro/config";

import sitemap from "@astrojs/sitemap";
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
	site: "https://www.seokhyunhwang.com",
	integrations: [
		tailwind(),
		sitemap({
			filter: (page) => {
				return ![
					"https://www.seokhyunhwang.com/about/",
					"https://www.seokhyunhwang.com/projects/",
					"https://www.seokhyunhwang.com/posts/",
				].includes(page);
			},
		}),
	],
});
