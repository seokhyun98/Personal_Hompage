import { readFile } from "node:fs/promises";

const SITE_ORIGIN = "https://seokhyunhwang.com";
const SITE_HOST = new URL(SITE_ORIGIN).hostname;
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow";
const INDEXNOW_KEY = "78e0996a6cfd159aa9c6b8c951d22265";
const EXPECTED_PUBLICATION_COUNT = 26;

const publicationDataFile = new URL(
	"../src/collections/publication-search.json",
	import.meta.url,
);
const publicationPdfDataFile = new URL(
	"../src/collections/publication-pdfs.json",
	import.meta.url,
);
const keyFile = new URL(`../public/${INDEXNOW_KEY}.txt`, import.meta.url);

const args = new Set(process.argv.slice(2));
const allowedArgs = new Set(["--dry-run"]);
const unknownArgs = [...args].filter((arg) => !allowedArgs.has(arg));

if (unknownArgs.length > 0) {
	throw new Error(`Unknown argument(s): ${unknownArgs.join(", ")}`);
}

if (!/^[0-9a-f]{32}$/.test(INDEXNOW_KEY)) {
	throw new Error(
		"The IndexNow key must be exactly 32 hexadecimal characters.",
	);
}

const keyContents = await readFile(keyFile, "utf8");
if (keyContents !== INDEXNOW_KEY && keyContents !== `${INDEXNOW_KEY}\n`) {
	throw new Error(
		"The public IndexNow key file must contain only the API key.",
	);
}

const publicationData = JSON.parse(await readFile(publicationDataFile, "utf8"));
if (!Array.isArray(publicationData.entries)) {
	throw new Error("publication-search.json must contain an entries array.");
}

const publicationPdfData = JSON.parse(
	await readFile(publicationPdfDataFile, "utf8"),
);
if (!Array.isArray(publicationPdfData.entries)) {
	throw new Error("publication-pdfs.json must contain an entries array.");
}

const slugs = publicationData.entries.map(({ slug }, index) => {
	if (typeof slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
		throw new Error(`Invalid publication slug at entries[${index}].`);
	}
	return slug;
});
const publicationSlugById = new Map(
	publicationData.entries.map(({ id, slug }) => [id, slug]),
);

const pdfPaths = publicationPdfData.entries.map(({ id, slug, path }, index) => {
	if (publicationSlugById.get(id) !== slug) {
		throw new Error(
			`PDF metadata at entries[${index}] does not match publication ${id}.`,
		);
	}
	const expectedPath = `/publications/${slug}/${slug}.pdf`;
	if (path !== expectedPath) {
		throw new Error(
			`Invalid PDF path at entries[${index}]; expected ${expectedPath}.`,
		);
	}
	return path;
});

if (slugs.length !== EXPECTED_PUBLICATION_COUNT) {
	throw new Error(
		`Expected ${EXPECTED_PUBLICATION_COUNT} publication slugs, found ${slugs.length}.`,
	);
}

if (new Set(slugs).size !== slugs.length) {
	throw new Error("Publication slugs must be unique.");
}

if (new Set(pdfPaths).size !== pdfPaths.length) {
	throw new Error("Publication PDF paths must be unique.");
}

const urlList = [
	new URL("/", SITE_ORIGIN).href,
	new URL("/publications/", SITE_ORIGIN).href,
	...slugs.map((slug) => new URL(`/publications/${slug}/`, SITE_ORIGIN).href),
	...pdfPaths.map((path) => new URL(path, SITE_ORIGIN).href),
	new URL("/cv.pdf", SITE_ORIGIN).href,
];

const expectedUrlCount = EXPECTED_PUBLICATION_COUNT + pdfPaths.length + 3;
if (urlList.length !== expectedUrlCount || urlList.length > 10_000) {
	throw new Error(
		`Expected ${expectedUrlCount} URLs within the 10,000 URL limit, found ${urlList.length}.`,
	);
}

if (new Set(urlList).size !== urlList.length) {
	throw new Error("IndexNow URL list contains duplicate URLs.");
}

for (const submittedUrl of urlList) {
	const parsedUrl = new URL(submittedUrl);
	if (
		parsedUrl.protocol !== "https:" ||
		parsedUrl.hostname !== SITE_HOST ||
		parsedUrl.port ||
		parsedUrl.username ||
		parsedUrl.password ||
		parsedUrl.search ||
		parsedUrl.hash
	) {
		throw new Error(`Invalid or off-host IndexNow URL: ${submittedUrl}`);
	}
}

const payload = {
	host: SITE_HOST,
	key: INDEXNOW_KEY,
	keyLocation: new URL(`/${INDEXNOW_KEY}.txt`, SITE_ORIGIN).href,
	urlList,
};

if (args.has("--dry-run")) {
	console.log(
		`IndexNow dry run validated ${urlList.length} URLs for ${SITE_HOST}. No request was sent.`,
	);
	process.exit(0);
}

const response = await fetch(INDEXNOW_ENDPOINT, {
	method: "POST",
	headers: {
		"Content-Type": "application/json; charset=utf-8",
	},
	body: JSON.stringify(payload),
	signal: AbortSignal.timeout(20_000),
});

const responseBody = await response.text();
if (response.status !== 200 && response.status !== 202) {
	const detail = responseBody.trim()
		? ` Response: ${responseBody.trim().slice(0, 500)}`
		: "";
	throw new Error(
		`IndexNow rejected the submission with HTTP ${response.status}.${detail}`,
	);
}

console.log(
	`IndexNow accepted ${urlList.length} URLs for ${SITE_HOST} (HTTP ${response.status}).`,
);
