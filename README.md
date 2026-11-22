# AI Chip Smuggling Enforcement Tracker

An open, case-level and defendant-level tracker of criminal and regulatory enforcement against people who divert advanced AI chips (and servers containing them) to China in violation of export controls.

The site is static (built with [Astro](https://astro.build)). Every page, number and chart is generated from two CSV files at build time; no case data lives in the templates.

```
data/
  cases.csv           one row per prosecution or official seizure (CS-###)
  defendants.csv      one row per charged person or company (DF-###), linked by Case ID
  CHANGELOG.md        every change to the data; becomes the public Updates page
reference/
  AI_Chip_Smuggling_Enforcement_Tracker.xlsx   original workbook (PRIVATE, git-ignored)
scripts/
  apply_changes.py    edit CSV cells and log each change in CHANGELOG.md
  check-headlines.mjs post-build check: recomputes headline numbers, fails on mismatch
src/
  config.js           site name, author, email, domain placeholders
  lib/                data loading, metric definitions, formatting, status vocabulary
  pages/              one file per page; cases/[id].astro makes one page per case
```

> **Privacy:** the workbook in `reference/` contains the private Watchlist. It is listed in `.gitignore` and is never copied into the built site. The build check fails if the word "Watchlist" or any spreadsheet appears in the output. Keep it that way.

## Run locally

Requires Node 20 or later.

```sh
npm install
npm run dev        # http://localhost:4321, reloads as you edit
npm run build      # builds dist/ and runs the headline check
npm run preview    # serves the built dist/ folder
```

## Update the data

1. **Edit the CSVs.** Either:
   - open `data/cases.csv` / `data/defendants.csv` in a spreadsheet or text editor (keep the header row and column names exactly as they are; save as UTF-8 CSV), or
   - describe the changes in a small JSON file and run `python3 scripts/apply_changes.py changes.json`. It records the old value for you and appends every change to `data/CHANGELOG.md`:
     ```json
     [{"id": "DF-007", "field": "Next event", "new": "Sentencing 26 May 2027",
       "source": "https://www.courtlistener.com/docket/…", "primary": "Yes", "note": ""}]
     ```
2. **Log every change** in `data/CHANGELOG.md` (automatic if you used the script). Each row: date, row ID, field, old value, new value, source URL, whether the source is primary, and an optional note. This file becomes the public Updates page.
3. **Update "Last verified"** on every row you checked. The site's "Data as of" date is the latest "Last verified" date in either file.
4. **Rebuild:** `npm run build`. If any headline number, required field or codebook value is wrong, the build stops and says why.

Rules that the data must follow (from the workbook's Read Me):
- People counts sum the "Persons represented" column; never count rows.
- A status may become more serious (guilty plea, conviction, sentence) only on the basis of a court record or an official government release.
- Every dollar figure needs "What the headline value measures"; never add figures with different bases.
- Allowed values for statuses, types and countries are listed in `src/lib/status.js` and checked by `scripts/check-headlines.mjs`. To add a new value, add it in both places.
- New cases go at the bottom with the next ID. A case page is created automatically.

## Placeholders to fill in

All in `src/config.js`: `author`, `affiliation`, `email`, `displayUrl`, `authorBio`. The "Key findings" box on the Findings page is in `src/pages/findings.astro`.

## Deploy

The live site is **https://chipsmugglingtracker.org**, served by GitHub Pages from the `gh-pages` branch of this repository.

To publish an update:

```sh
git add -A && git commit -m "Describe the update" && git push   # save the source
npm run deploy                                                 # build, check, and publish
```

`npm run deploy` builds the site, runs the headline check (it stops if anything is wrong), and pushes the built files to `gh-pages`. Changes appear within a minute or two.

The custom domain is set by `public/CNAME` and in the repository's Settings > Pages. DNS at Porkbun points the domain at GitHub Pages: four A records on the bare domain (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and a CNAME record for `www` pointing to `kittykatwu.github.io`.

The site is plain static files, so Netlify or Vercel would also work (`netlify.toml` is included).

## Licence

Data: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). Cite as shown in the site footer.
