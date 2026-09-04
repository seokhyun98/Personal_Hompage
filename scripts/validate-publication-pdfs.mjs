import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { open, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const publicRoot = path.join(repositoryRoot, "public");
const publicationPdfRoot = path.join(publicRoot, "publications");
const publicationDataFile = path.join(
	repositoryRoot,
	"src/collections/publication-search.json",
);
const publicationPdfDataFile = path.join(
	repositoryRoot,
	"src/collections/publication-pdfs.json",
);
const allowedVersions = new Set([
	"version-of-record",
	"author-accepted-manuscript",
	"preprint",
]);
const MAX_PDF_BYTES = 5_000_000;
const expectedOptimization = {
	tool: "PyMuPDF + Pillow",
	toolVersion: "PyMuPDF 1.26.4; Pillow 11.3.0",
	method:
		"Direct image XObject downsampling with page content, searchable text, page geometry, and annotations preserved",
	targetImageResolutionDpi: 150,
	jpegQuality: 86,
	maxBytes: MAX_PDF_BYTES,
};

function requireCondition(condition, message) {
	if (!condition) throw new Error(message);
}

function parseHttpsUrl(value, label) {
	requireCondition(typeof value === "string", `${label} must be a URL.`);
	const parsed = new URL(value);
	requireCondition(parsed.protocol === "https:", `${label} must use HTTPS.`);
}

async function sha256(filePath) {
	const hash = createHash("sha256");
	for await (const chunk of createReadStream(filePath)) hash.update(chunk);
	return hash.digest("hex");
}

async function walkPdfFiles(directory) {
	const entries = await readdir(directory, { withFileTypes: true });
	const files = [];
	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) files.push(...(await walkPdfFiles(entryPath)));
		else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf"))
			files.push(entryPath);
	}
	return files;
}

const publicationData = JSON.parse(await readFile(publicationDataFile, "utf8"));
const publicationPdfData = JSON.parse(
	await readFile(publicationPdfDataFile, "utf8"),
);

requireCondition(
	Array.isArray(publicationData.entries),
	"publication-search.json must contain an entries array.",
);
requireCondition(
	Array.isArray(publicationPdfData.entries),
	"publication-pdfs.json must contain an entries array.",
);
requireCondition(
	Array.isArray(publicationPdfData.meta?.unavailable),
	"publication-pdfs.json meta must contain an unavailable array.",
);
requireCondition(
	publicationPdfData.meta?.availableCount === publicationPdfData.entries.length,
	"publication-pdfs.json availableCount must match the entries array.",
);
requireCondition(
	/^\d{4}-\d{2}-\d{2}$/u.test(publicationPdfData.meta?.retrieval?.date ?? ""),
	"publication-pdfs.json must record the retrieval date.",
);
requireCondition(
	typeof publicationPdfData.meta?.retrieval?.method === "string" &&
		publicationPdfData.meta.retrieval.method.trim().length > 0,
	"publication-pdfs.json must record the retrieval method.",
);
for (const [field, expectedValue] of Object.entries(expectedOptimization)) {
	requireCondition(
		publicationPdfData.meta?.optimization?.[field] === expectedValue,
		`publication-pdfs.json optimization.${field} must be ${expectedValue}.`,
	);
}

const publicationSlugById = new Map(
	publicationData.entries.map(({ id, slug }) => [id, slug]),
);
requireCondition(
	publicationSlugById.size === publicationData.entries.length,
	"Publication identifiers must be unique.",
);

const pdfIds = new Set();
const pdfPaths = new Set();
let totalBytes = 0;

for (const entry of publicationPdfData.entries) {
	requireCondition(
		!pdfIds.has(entry.id),
		`Duplicate PDF metadata for ${entry.id}.`,
	);
	pdfIds.add(entry.id);
	requireCondition(
		publicationSlugById.get(entry.id) === entry.slug,
		`PDF metadata for ${entry.id} has an unknown or mismatched slug.`,
	);
	const expectedPath = `/publications/${entry.slug}/${entry.slug}.pdf`;
	requireCondition(
		entry.path === expectedPath,
		`PDF path for ${entry.id} must be ${expectedPath}.`,
	);
	requireCondition(
		!pdfPaths.has(entry.path),
		`Duplicate PDF path ${entry.path}.`,
	);
	pdfPaths.add(entry.path);
	requireCondition(
		allowedVersions.has(entry.version),
		`Unsupported PDF version for ${entry.id}.`,
	);
	requireCondition(
		Number.isSafeInteger(entry.bytes) && entry.bytes > 0,
		`PDF byte size for ${entry.id} must be a positive integer.`,
	);
	requireCondition(
		entry.bytes <= MAX_PDF_BYTES,
		`PDF for ${entry.id} exceeds the ${MAX_PDF_BYTES.toLocaleString(
			"en-US",
		)}-byte Google Scholar limit: ${entry.bytes.toLocaleString(
			"en-US",
		)} bytes.`,
	);
	requireCondition(
		Number.isSafeInteger(entry.pageCount) && entry.pageCount > 0,
		`PDF page count for ${entry.id} must be a positive integer.`,
	);
	requireCondition(
		typeof entry.sha256 === "string" && /^[0-9a-f]{64}$/u.test(entry.sha256),
		`PDF SHA-256 for ${entry.id} is invalid.`,
	);
	parseHttpsUrl(entry.sourceUrl, `PDF source URL for ${entry.id}`);
	if (entry.licenseUrl) {
		requireCondition(
			typeof entry.license === "string" && entry.license.length > 0,
			`PDF license URL for ${entry.id} requires a license label.`,
		);
		parseHttpsUrl(entry.licenseUrl, `PDF license URL for ${entry.id}`);
	}
	if (entry.rightsUrl) {
		requireCondition(
			typeof entry.rightsNote === "string" && entry.rightsNote.length > 0,
			`PDF rights URL for ${entry.id} requires a rights note.`,
		);
		parseHttpsUrl(entry.rightsUrl, `PDF rights URL for ${entry.id}`);
	}

	const diskPath = path.join(publicRoot, entry.path.slice(1));
	requireCondition(
		diskPath.startsWith(`${publicationPdfRoot}${path.sep}`),
		`PDF path for ${entry.id} escapes the publication directory.`,
	);
	const fileStats = await stat(diskPath);
	requireCondition(fileStats.isFile(), `PDF for ${entry.id} is not a file.`);
	requireCondition(
		fileStats.size === entry.bytes,
		`PDF byte size mismatch for ${entry.id}: metadata ${entry.bytes}, file ${fileStats.size}.`,
	);
	requireCondition(
		fileStats.size <= MAX_PDF_BYTES,
		`Deployed PDF for ${entry.id} exceeds the ${MAX_PDF_BYTES.toLocaleString(
			"en-US",
		)}-byte Google Scholar limit: ${fileStats.size.toLocaleString(
			"en-US",
		)} bytes.`,
	);
	totalBytes += fileStats.size;

	const file = await open(diskPath, "r");
	try {
		const header = Buffer.alloc(5);
		await file.read(header, 0, header.length, 0);
		requireCondition(
			header.toString("ascii") === "%PDF-",
			`File for ${entry.id} does not have a PDF header.`,
		);
		const tailLength = Math.min(2048, fileStats.size);
		const tail = Buffer.alloc(tailLength);
		await file.read(tail, 0, tailLength, fileStats.size - tailLength);
		requireCondition(
			tail.includes(Buffer.from("%%EOF")),
			`File for ${entry.id} does not have a PDF end marker.`,
		);
	} finally {
		await file.close();
	}

	const actualHash = await sha256(diskPath);
	requireCondition(
		actualHash === entry.sha256,
		`PDF SHA-256 mismatch for ${entry.id}.`,
	);
}

const unavailableIds = new Set();
for (const entry of publicationPdfData.meta.unavailable) {
	requireCondition(
		publicationSlugById.has(entry.id),
		`Unavailable PDF metadata refers to unknown publication ${entry.id}.`,
	);
	requireCondition(
		!unavailableIds.has(entry.id),
		`Duplicate unavailable PDF metadata for ${entry.id}.`,
	);
	requireCondition(
		!pdfIds.has(entry.id),
		`${entry.id} cannot have both a PDF and an unavailable record.`,
	);
	requireCondition(
		typeof entry.reason === "string" && entry.reason.trim().length > 0,
		`Unavailable PDF metadata for ${entry.id} requires a reason.`,
	);
	unavailableIds.add(entry.id);
}

const coveredIds = new Set([...pdfIds, ...unavailableIds]);
requireCondition(
	coveredIds.size === publicationSlugById.size &&
		[...publicationSlugById.keys()].every((id) => coveredIds.has(id)),
	"Every publication must have either PDF metadata or an unavailable record.",
);

const diskPdfPaths = new Set(
	(await walkPdfFiles(publicationPdfRoot)).map(
		(filePath) =>
			`/${path.relative(publicRoot, filePath).split(path.sep).join("/")}`,
	),
);
requireCondition(
	diskPdfPaths.size === pdfPaths.size &&
		[...diskPdfPaths].every((filePath) => pdfPaths.has(filePath)),
	"PDF files on disk must exactly match publication-pdfs.json.",
);

console.log(
	`Validated ${pdfIds.size} publication PDFs (${totalBytes.toLocaleString(
		"en-US",
	)} bytes); ${
		unavailableIds.size
	} publications have documented public-source gaps.`,
);
