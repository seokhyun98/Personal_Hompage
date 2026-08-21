import type { APIRoute } from "astro";
import about from "../collections/about.json";
import {
	SITE_ORIGIN,
	absolutePublicationUrl,
	displayTag,
	publicationAssetUrl,
	publicationKindLabel,
	scholarlyPublications,
} from "../lib/scholarly-publications";

export const prerender = true;

function renderPublication(
	publication: (typeof scholarlyPublications)[number],
): string {
	const metadata = [
		`- Local ID: ${publication.id}`,
		`- Type: ${publicationKindLabel(publication.publicationKind)}`,
		`- Authors: ${publication.authors
			.map((author) => author.displayName)
			.join("; ")}`,
		`- Container: ${publication.containerTitle}`,
		`- Publication date: ${publication.publicationDate}`,
		...(publication.volume ? [`- Volume: ${publication.volume}`] : []),
		...(publication.issue ? [`- Issue: ${publication.issue}`] : []),
		...(publication.pages ? [`- Pages: ${publication.pages}`] : []),
		...(publication.articleNumber
			? [`- Article number: ${publication.articleNumber}`]
			: []),
		...(publication.doi ? [`- DOI: https://doi.org/${publication.doi}`] : []),
		...(publication.preprintUrl
			? [`- Preprint: ${publication.preprintUrl}`]
			: []),
		`- Topics: ${publication.tags.map(displayTag).join("; ")}`,
		`- Canonical detail page: ${absolutePublicationUrl(publication)}`,
		`- BibTeX: ${publicationAssetUrl(publication, "bib", SITE_ORIGIN)}`,
		`- RIS: ${publicationAssetUrl(publication, "ris", SITE_ORIGIN)}`,
		`- CSL JSON: ${publicationAssetUrl(publication, "json", SITE_ORIGIN)}`,
	].join("\n");

	return `## ${publication.title}

${metadata}

### Abstract

${publication.abstract}`;
}

const body = `# Seokhyun Hwang: full scholarly publication corpus

> Author-maintained abstracts and verified citation metadata for ${
	scholarlyPublications.length
} publications. Homepage titles remain the authoritative public labels except where an official publisher title is explicitly recorded for citation matching.

Canonical site: ${SITE_ORIGIN}/
Publications index: ${SITE_ORIGIN}/publications/
ORCID: https://orcid.org/0000-0001-5244-017X
Google Scholar: ${
	about.socialLinks.find((profile) => profile.label === "Google Scholar")?.url
}
Contact: mailto:${about.email}

${scholarlyPublications.map(renderPublication).join("\n\n")}
`;

export const GET: APIRoute = () =>
	new Response(body, {
		headers: {
			"Access-Control-Allow-Origin": "*",
			"Cache-Control": "public, max-age=3600",
			"Content-Type": "text/plain; charset=utf-8",
			"X-Content-Type-Options": "nosniff",
		},
	});
