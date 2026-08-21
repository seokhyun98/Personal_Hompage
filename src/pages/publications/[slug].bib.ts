import type { APIRoute, GetStaticPaths } from "astro";
import {
	type ScholarlyPublication,
	absolutePublicationUrl,
	scholarlyPublications,
	toBibTeX,
} from "../../lib/scholarly-publications";

export const prerender = true;

export const getStaticPaths = (() =>
	scholarlyPublications.map((publication) => ({
		params: { slug: publication.slug },
		props: { publication },
	}))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ props }) => {
	const publication = props.publication as ScholarlyPublication;
	return new Response(`${toBibTeX(publication)}\n`, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
			"Content-Disposition": `inline; filename="${publication.slug}.bib"`,
			"Content-Type": "application/x-bibtex; charset=utf-8",
			Link: `<${absolutePublicationUrl(publication)}>; rel="canonical"`,
			"X-Content-Type-Options": "nosniff",
		},
	});
};
