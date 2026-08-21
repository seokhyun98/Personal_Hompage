import type { APIRoute } from "astro";
import about from "../collections/about.json";
import {
	SITE_ORIGIN,
	absolutePublicationUrl,
	publicationKindLabel,
	scholarlyPublications,
} from "../lib/scholarly-publications";

export const prerender = true;

function profileLink(label: string): string | undefined {
	return about.socialLinks.find((profile) => profile.label === label)?.url;
}

function renderPublicationLine(
	publication: (typeof scholarlyPublications)[number],
): string {
	const detailUrl = absolutePublicationUrl(publication);
	const identifier = publication.doi
		? ` DOI: https://doi.org/${publication.doi}.`
		: publication.preprintUrl
			? ` Preprint: ${publication.preprintUrl}.`
			: "";
	return `- [${publication.title}](${detailUrl}) (${
		publication.year
	}; ${publicationKindLabel(
		publication.publicationKind,
	)}). ${publication.authors.map((author) => author.displayName).join(", ")}. ${
		publication.containerTitle
	}.${identifier}`;
}

const body = `# Seokhyun Hwang

> Seokhyun (Shawn) Hwang is a Ph.D. student in Information Science at the University of Washington. His research spans human-computer interaction, human-AI interaction, adaptive interfaces, VR/AR/XR, haptics, wearable systems, automotive interaction, and assistive and health technologies.

Canonical site: ${SITE_ORIGIN}/
Publications index: ${SITE_ORIGIN}/publications/
Current CV: ${SITE_ORIGIN}/cv.pdf
Contact: mailto:${about.email}

## Verified researcher profiles

- ORCID: ${profileLink("ORCID")}
- Google Scholar: ${profileLink("Google Scholar")}
- ACM Digital Library: ${profileLink("ACM DL")}
- DBLP: https://dblp.org/pid/195/9711
- University of Washington: ${profileLink("UW Profile")}

## Citation data

- BibTeX collection: ${SITE_ORIGIN}/publications.bib
- RIS collection: ${SITE_ORIGIN}/publications.ris
- CSL JSON collection: ${SITE_ORIGIN}/publications.json
- Full publication corpus with abstracts: ${SITE_ORIGIN}/llms-full.txt

## Publications

${scholarlyPublications.map(renderPublicationLine).join("\n")}
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
