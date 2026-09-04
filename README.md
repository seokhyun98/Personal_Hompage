# Seokhyun Hwang - Personal Homepage

Personal academic homepage built with [Astro](https://astro.build), featuring publications, research interests, and fun projects.

**Live site:** [https://seokhyunhwang.com](https://seokhyunhwang.com)

### Development

```bash
npm install    # install dependencies
npm run dev    # start dev server
npm run build  # build for production
```

### Scholarly discovery

- `src/collections/publications.json` remains the homepage publication source.
- `src/collections/publication-search.json` supplies verified full names, abstracts, dates, identifiers, and stable slugs for the publication detail and citation routes.
- Production builds expose `/publications/`, one HTML page per publication, BibTeX/RIS/CSL JSON exports, and `llms.txt`/`llms-full.txt`.
- Publicly distributable paper PDFs live beside their detail pages at `/publications/<slug>/<slug>.pdf`; Google Scholar retrieval provenance, version, rights, and integrity metadata are recorded in `src/collections/publication-pdfs.json`.
- `npm run validate:pdfs` verifies that every publication has either a matching PDF or a documented public-source gap, and checks each hosted file's path, size, header, end marker, and SHA-256 digest.
- `public/cv.pdf` is the stable public CV URL. Editable source documents live locally in the ignored `source-documents/` directory, and historical CVs live locally in the ignored `archive/` directory; neither is committed or deployed.
- `node scripts/submit-indexnow.mjs --dry-run` validates the post-deploy IndexNow payload without sending it.

> This project uses **npm** only. Do not use pnpm or yarn.
