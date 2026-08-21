import type { APIRoute } from "astro";
import {
	scholarlyPublications,
	serializeRIS,
} from "../lib/scholarly-publications";

export const prerender = true;

export const GET: APIRoute = () =>
	new Response(serializeRIS(scholarlyPublications), {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
			"Content-Disposition":
				'inline; filename="seokhyun-hwang-publications.ris"',
			"Content-Type": "application/x-research-info-systems; charset=utf-8",
			Link: '<https://seokhyunhwang.com/publications/>; rel="canonical"',
			"X-Content-Type-Options": "nosniff",
		},
	});
