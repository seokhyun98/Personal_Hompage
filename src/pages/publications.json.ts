import type { APIRoute } from "astro";
import {
	scholarlyPublications,
	serializeCslJson,
} from "../lib/scholarly-publications";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(serializeCslJson(scholarlyPublications), {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
			"Content-Disposition":
				'inline; filename="seokhyun-hwang-publications.json"',
			"Content-Type": "application/vnd.citationstyles.csl+json; charset=utf-8",
			Link: '<https://seokhyunhwang.com/publications/>; rel="canonical"',
			"X-Content-Type-Options": "nosniff",
		},
	});
