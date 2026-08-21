import type { APIRoute } from "astro";
import {
	scholarlyPublications,
	serializeBibTeX,
} from "../lib/scholarly-publications";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(serializeBibTeX(scholarlyPublications), {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
			"Content-Disposition":
				'inline; filename="seokhyun-hwang-publications.bib"',
			"Content-Type": "application/x-bibtex; charset=utf-8",
			Link: '<https://seokhyunhwang.com/publications/>; rel="canonical"',
			"X-Content-Type-Options": "nosniff",
		},
	});
