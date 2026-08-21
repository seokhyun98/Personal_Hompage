import publicationSearchData from "../collections/publication-search.json";
import publicationsData from "../collections/publications.json";

export const SITE_ORIGIN = "https://seokhyunhwang.com";

export type PublicationKind =
	| "journal-article"
	| "conference-paper"
	| "conference-paper-accepted"
	| "conference-companion-paper"
	| "workshop-paper"
	| "extended-abstract";

export interface ScholarlyAuthor {
	familyName: string;
	givenName: string;
	displayName: string;
	order: number;
	namePartsInferred: boolean;
	equalContribution?: boolean;
}

interface PublicationMedia {
	type: string;
	src: string;
	poster?: string;
}

interface CanonicalPublication {
	id: string;
	group: "publication";
	tags: string[];
	title: string;
	authors: string;
	venue: string;
	link?: string;
	status?: string;
	award?: string;
	media: PublicationMedia;
}

interface SearchSupplement {
	id: string;
	slug: string;
	abstract: string;
	year: number;
	publicationDate: string;
	publicationDatePrecision: "day" | "year";
	publicationDateSource: string;
	publicationKind: PublicationKind;
	publicationKindSource: string;
	containerTitle: string;
	containerTitleSource: string;
	doi?: string;
	doiSource?: string;
	externalUrl?: string;
	preprint?: string;
	preprintUrl?: string;
	preprintDate?: string;
	preprintSource?: string;
	volume?: string;
	issue?: string;
	pages?: string;
	articleNumber?: string;
	pageCount?: number;
	officialTitle?: string;
	officialTitleSource?: string;
	authors: ScholarlyAuthor[];
	authorSource: string;
}

export interface ScholarlyPublication
	extends Omit<CanonicalPublication, "title" | "link" | "authors">,
		SearchSupplement {
	title: string;
	homepageTitle: string;
	homepageLink?: string;
	citationAuthors: string;
}

const canonicalEntries = publicationsData.entries.filter(
	(entry) => entry.group === "publication",
) as CanonicalPublication[];
const supplements = publicationSearchData.entries as SearchSupplement[];
const supplementById = new Map(supplements.map((entry) => [entry.id, entry]));

if (canonicalEntries.length !== supplements.length) {
	throw new Error(
		`Publication metadata mismatch: ${canonicalEntries.length} homepage records and ${supplements.length} discovery records.`,
	);
}

export const scholarlyPublications: ScholarlyPublication[] =
	canonicalEntries.map((publication) => {
		const supplement = supplementById.get(publication.id);
		if (!supplement) {
			throw new Error(
				`Missing scholarly discovery metadata for ${publication.id}.`,
			);
		}

		return {
			...publication,
			...supplement,
			homepageTitle: publication.title,
			title: supplement.officialTitle ?? publication.title,
			homepageLink: publication.link || undefined,
			citationAuthors: publication.authors,
		};
	});

const publicationBySlug = new Map(
	scholarlyPublications.map((publication) => [publication.slug, publication]),
);
const publicationById = new Map(
	scholarlyPublications.map((publication) => [publication.id, publication]),
);

if (
	publicationBySlug.size !== scholarlyPublications.length ||
	publicationById.size !== scholarlyPublications.length
) {
	throw new Error("Publication slugs and identifiers must be unique.");
}

export function getPublicationBySlug(
	slug: string,
): ScholarlyPublication | undefined {
	return publicationBySlug.get(slug);
}

export function getPublicationById(
	id: string,
): ScholarlyPublication | undefined {
	return publicationById.get(id);
}

export function publicationPath(publication: ScholarlyPublication): string {
	return `/publications/${publication.slug}/`;
}

export function absolutePublicationUrl(
	publication: ScholarlyPublication,
	origin = SITE_ORIGIN,
): string {
	return new URL(
		publicationPath(publication),
		`${origin.replace(/\/$/u, "")}/`,
	).toString();
}

export function publicationAssetUrl(
	publication: ScholarlyPublication,
	extension: "bib" | "ris" | "json",
	origin?: string,
): string {
	const path = `/publications/${publication.slug}.${extension}`;
	return origin
		? new URL(path, `${origin.replace(/\/$/u, "")}/`).toString()
		: path;
}

export function displayTag(tag: string): string {
	return tag
		.replaceAll("_", " ")
		.replaceAll("&", " & ")
		.replace(/\s+/gu, " ")
		.trim();
}

export function publicationKindLabel(kind: PublicationKind): string {
	switch (kind) {
		case "journal-article":
			return "Journal article";
		case "conference-paper-accepted":
			return "Accepted conference paper";
		case "conference-companion-paper":
			return "Conference companion paper";
		case "workshop-paper":
			return "Workshop paper";
		case "extended-abstract":
			return "Extended abstract";
		default:
			return "Conference paper";
	}
}

function escapeBibTeX(value: string): string {
	const replacements: Record<string, string> = {
		"\\": "\\textbackslash{}",
		"{": "\\{",
		"}": "\\}",
		"%": "\\%",
		"&": "\\&",
		"#": "\\#",
		_: "\\_",
		$: "\\$",
	};
	return value.replace(/[\\{}%&#_$]/gu, (character) => replacements[character]);
}

function asciiKeyPart(value: string): string {
	return value
		.normalize("NFKD")
		.replace(/\p{Diacritic}/gu, "")
		.replace(/[^a-z0-9]/giu, "")
		.toLowerCase();
}

export function citationKey(publication: ScholarlyPublication): string {
	const firstAuthor = asciiKeyPart(
		publication.authors[0]?.familyName ?? "hwang",
	);
	const titleWords = publication.slug
		.split("-")
		.filter(
			(word) =>
				!["a", "an", "and", "for", "in", "of", "the", "to"].includes(word),
		)
		.slice(0, 3)
		.join("");
	return `${firstAuthor}${publication.year}${asciiKeyPart(titleWords)}`;
}

function bibTeXType(
	publication: ScholarlyPublication,
): "article" | "inproceedings" {
	return publication.publicationKind === "journal-article"
		? "article"
		: "inproceedings";
}

export function toBibTeX(publication: ScholarlyPublication): string {
	const type = bibTeXType(publication);
	const authors = publication.authors
		.map((author) => `${author.familyName}, ${author.givenName}`)
		.join(" and ");
	const fields: Array<[string, string | number | undefined]> = [
		["title", publication.title],
		["author", authors],
		[type === "article" ? "journal" : "booktitle", publication.containerTitle],
		["year", publication.year],
		["volume", publication.volume],
		["number", publication.issue],
		["pages", publication.pages ?? publication.articleNumber],
		["doi", publication.doi],
		[
			"url",
			publication.doi
				? `https://doi.org/${publication.doi}`
				: publication.externalUrl,
		],
		["abstract", publication.abstract],
		["keywords", publication.tags.map(displayTag).join(", ")],
		["note", publication.status],
	];
	const renderedFields = fields
		.filter(
			(field): field is [string, string | number] =>
				field[1] !== undefined && field[1] !== "",
		)
		.map(([name, value]) => `  ${name} = {${escapeBibTeX(String(value))}}`)
		.join(",\n");

	return `@${type}{${citationKey(publication)},\n${renderedFields}\n}`;
}

export function serializeBibTeX(publications: ScholarlyPublication[]): string {
	return `${publications.map(toBibTeX).join("\n\n")}\n`;
}

function risType(publication: ScholarlyPublication): "JOUR" | "CPAPER" {
	return publication.publicationKind === "journal-article" ? "JOUR" : "CPAPER";
}

function risLine(
	tag: string,
	value: string | number | undefined,
): string | undefined {
	if (value === undefined || value === "") return undefined;
	return `${tag}  - ${String(value).replace(/\s+/gu, " ").trim()}`;
}

export function toRIS(publication: ScholarlyPublication): string {
	const lines = [
		risLine("TY", risType(publication)),
		risLine("ID", publication.id),
		risLine("TI", publication.title),
		...publication.authors.map((author) =>
			risLine("AU", `${author.familyName}, ${author.givenName}`),
		),
		risLine("PY", publication.year),
		risLine("DA", publication.publicationDate),
		risLine(
			"JO",
			publication.publicationKind === "journal-article"
				? publication.containerTitle
				: undefined,
		),
		risLine(
			"T2",
			publication.publicationKind !== "journal-article"
				? publication.containerTitle
				: undefined,
		),
		risLine("VL", publication.volume),
		risLine("IS", publication.issue),
		risLine(
			"SP",
			publication.pages?.split("-")[0] ?? publication.articleNumber,
		),
		risLine("EP", publication.pages?.split("-")[1]),
		risLine("DO", publication.doi),
		risLine(
			"UR",
			publication.doi
				? `https://doi.org/${publication.doi}`
				: publication.externalUrl,
		),
		risLine("AB", publication.abstract),
		...publication.tags.map((tag) => risLine("KW", displayTag(tag))),
		risLine("N1", publication.status),
		risLine("ER", ""),
	].filter((line): line is string => Boolean(line));

	// RIS terminators intentionally carry no value.
	lines.push("ER  -");
	return lines.join("\r\n");
}

export function serializeRIS(publications: ScholarlyPublication[]): string {
	return `${publications.map(toRIS).join("\r\n\r\n")}\r\n`;
}

export interface CslJsonPublication {
	id: string;
	type: "article-journal" | "paper-conference";
	title: string;
	author: Array<{ family: string; given: string }>;
	issued: { "date-parts": number[][] };
	"container-title": string;
	volume?: string;
	issue?: string;
	page?: string;
	DOI?: string;
	URL: string;
	abstract: string;
	keyword: string;
	status?: string;
}

function cslDateParts(publicationDate: string): number[] {
	return publicationDate.split("-").map((part) => Number.parseInt(part, 10));
}

export function toCslJson(
	publication: ScholarlyPublication,
): CslJsonPublication {
	return {
		id: citationKey(publication),
		type:
			publication.publicationKind === "journal-article"
				? "article-journal"
				: "paper-conference",
		title: publication.title,
		author: publication.authors.map((author) => ({
			family: author.familyName,
			given: author.givenName,
		})),
		issued: { "date-parts": [cslDateParts(publication.publicationDate)] },
		"container-title": publication.containerTitle,
		...(publication.volume ? { volume: publication.volume } : {}),
		...(publication.issue ? { issue: publication.issue } : {}),
		...(publication.pages || publication.articleNumber
			? { page: publication.pages ?? publication.articleNumber }
			: {}),
		...(publication.doi ? { DOI: publication.doi } : {}),
		URL: publication.doi
			? `https://doi.org/${publication.doi}`
			: publication.externalUrl ?? absolutePublicationUrl(publication),
		abstract: publication.abstract,
		keyword: publication.tags.map(displayTag).join(", "),
		...(publication.status ? { status: publication.status } : {}),
	};
}

export function serializeCslJson(publications: ScholarlyPublication[]): string {
	const data =
		publications.length === 1
			? toCslJson(publications[0])
			: publications.map(toCslJson);
	return `${JSON.stringify(data, null, 2)}\n`;
}
