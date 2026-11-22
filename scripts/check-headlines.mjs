#!/usr/bin/env node
// Post-build check. Recomputes every headline number directly from the CSVs,
// using its own code (it does not import the site's metrics module), and fails
// if any built page or download shows something different. Also checks data
// integrity and that nothing private is published.
//
// Run: npm run check   (runs automatically after `npm run build`)
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const DIST = path.join(ROOT, 'dist');
const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);
const warn = (m) => warnings.push(m);

const read = (f) => parse(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), { columns: true, skip_empty_lines: true, trim: true, bom: true });
const cases = read('cases.csv');
const defs = read('defendants.csv');
const n = (v) => {
  const s = String(v ?? '').replace(/[$,\s]/g, '');
  if (!s) return null;
  const x = Number(s);
  return Number.isFinite(x) ? x : null;
};
const people = (d) => n(d['Persons represented']) ?? 1;
const add = (a) => a.reduce((x, y) => x + y, 0);

// ---------- 1. Recompute headline numbers ----------
const indiv = defs.filter((d) => d['Type'] === 'Individual');
const reached = cases.map((c) => n(c['Value alleged to have reached China (USD)'])).filter((v) => v !== null && v > 0);
const months = cases
  .filter((c) => c['Conduct start (approx.)'] && c['First official action (date)'])
  .map((c) => (Date.parse(c['First official action (date)']) - Date.parse(c['Conduct start (approx.)'])) / 86400000 / 30.4375);
const expected = {
  'individuals-charged': add(indiv.map(people)),
  countries: new Set(indiv.map((d) => d['Prosecuting country']).filter(Boolean)).size,
  'guilty-pleas': add(indiv.filter((d) => /^guilty/i.test(d['Plea'] || '')).map(people)),
  sentences: add(indiv.filter((d) => d['Current status'] === 'Sentenced').map(people)),
  'reached-china': add(reached),
  'months-to-action': months.length ? Math.round((add(months) / months.length) * 10) / 10 : null,
};
const asOf = [...cases, ...defs].map((r) => r['Last verified']).filter(Boolean).sort().at(-1);

const money = (x) => {
  const t = (v) => (Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, '');
  if (x >= 1e9) return `$${t(x / 1e9)} billion`;
  if (x >= 1e6) return `$${t(x / 1e6)} million`;
  return `$${Math.round(x).toLocaleString('en-US')}`;
};
const expectedDisplay = {
  ...Object.fromEntries(Object.entries(expected).map(([k, v]) => [k, String(v)])),
  'reached-china': money(expected['reached-china']),
  'months-to-action': expected['months-to-action'] === null ? 'n/a' : expected['months-to-action'].toFixed(1),
};

// ---------- 2. Compare with built pages ----------
if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const files = walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
let shown = 0;
const seenKeys = new Set();
for (const f of html) {
  const src = fs.readFileSync(f, 'utf8');
  const rel = path.relative(DIST, f);
  // Each metric element: data-metric, data-value, data-asof; display in .metric-display
  const re = /<(li|tr)\b([^>]*\bdata-metric="([^"]+)"[^>]*)>([\s\S]*?)<\/\1>/g;
  let m;
  while ((m = re.exec(src))) {
    const [, , attrs, key, inner] = m;
    shown++;
    seenKeys.add(key);
    const val = /data-value="([^"]*)"/.exec(attrs)?.[1];
    const asof = /data-asof="([^"]*)"/.exec(attrs)?.[1];
    const disp = decode(/class="metric-display"[^>]*>([^<]*)</.exec(inner)?.[1] ?? '');
    if (!(key in expected)) { fail(`${rel}: unknown metric "${key}"`); continue; }
    if (String(expected[key]) !== val) fail(`${rel}: ${key} data-value=${val}, expected ${expected[key]}`);
    if (disp !== expectedDisplay[key]) fail(`${rel}: ${key} shows "${disp}", expected "${expectedDisplay[key]}"`);
    if (asof !== asOf) fail(`${rel}: ${key} as-of ${asof}, expected ${asOf}`);
    if (!/class="stat-def"|data-label="Definition"/.test(inner)) fail(`${rel}: ${key} shown without its definition`);
    if (!/As of/.test(inner)) fail(`${rel}: ${key} shown without an "As of" date`);
  }
  // Footer on every page
  if (!src.includes('Inclusion does not imply guilt')) fail(`${rel}: footer disclaimer missing`);
  if (!src.includes('Data as of')) fail(`${rel}: "Data as of" missing`);
  // Dollar figures on case pages must carry their basis
  for (const mm of src.matchAll(/class="money"([^>]*)>/g)) {
    const basis = /data-basis="([^"]*)"/.exec(mm[1])?.[1];
    if (!basis || !basis.trim()) fail(`${rel}: dollar figure without a basis`);
  }
  // Every case page must carry the presumption-of-innocence line (unless a seizure)
  if (/^cases[\\/]CS-/.test(rel) && !/presumed innocent|No one has been charged/.test(src)) fail(`${rel}: presumption-of-innocence notice missing`);
}
for (const k of Object.keys(expected)) if (!seenKeys.has(k)) fail(`metric "${k}" is not shown on any page`);

const jsonPath = path.join(DIST, 'data', 'headline-numbers.json');
if (!fs.existsSync(jsonPath)) fail('data/headline-numbers.json missing');
else {
  const j = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (j.as_of !== asOf) fail(`headline-numbers.json as_of ${j.as_of}, expected ${asOf}`);
  for (const x of j.numbers) if (String(x.value) !== String(expected[x.key])) fail(`headline-numbers.json ${x.key}=${x.value}, expected ${expected[x.key]}`);
}

// ---------- 3. Privacy ----------
for (const f of files) {
  if (/\.xlsx?$/i.test(f)) fail(`spreadsheet published: ${path.relative(DIST, f)}`);
  if (/\.(html|json|csv|xml|txt|js)$/.test(f) && /watchlist/i.test(fs.readFileSync(f, 'utf8'))) fail(`"Watchlist" appears in ${path.relative(DIST, f)}`);
}
for (const name of ['cases.csv', 'defendants.csv']) {
  const pub = path.join(DIST, 'data', name);
  if (!fs.existsSync(pub)) fail(`data/${name} download missing`);
  else if (fs.readFileSync(pub, 'utf8') !== fs.readFileSync(path.join(ROOT, 'data', name), 'utf8')) fail(`data/${name} download differs from source`);
}

// ---------- 4. Data integrity ----------
const CASE_STATUS = ['Charged - pending', 'Partially resolved', 'Resolved', 'Seizure - no charges yet'];
const DEF_STATUS = ['Charged - pending', 'Pleaded not guilty - awaiting trial', 'Pleaded guilty - awaiting sentence', 'Pleaded guilty - sentence not confirmed', 'Sentenced', 'Convicted at trial', 'Acquitted', 'Dismissed', 'Fugitive'];
const caseIds = new Set();
for (const c of cases) {
  const id = c['Case ID'];
  if (!/^CS-\d{3}$/.test(id)) fail(`bad Case ID "${id}"`);
  if (caseIds.has(id)) fail(`duplicate Case ID ${id}`);
  caseIds.add(id);
  if (!CASE_STATUS.includes(c['Case status'])) fail(`${id}: case status "${c['Case status']}" not in codebook`);
  for (const k of ['Case name', 'Prosecuting country', 'First official action (date)', 'Last verified']) if (!c[k]) fail(`${id}: required field "${k}" blank`);
  if (n(c['Headline value cited (USD)']) !== null && !c['What the headline value measures']) fail(`${id}: headline value without "What the headline value measures"`);
  const ds = defs.filter((d) => d['Case ID'] === id);
  const pi = add(ds.filter((d) => d['Type'] === 'Individual').map(people));
  const pc = add(ds.filter((d) => d['Type'] === 'Company').map(people));
  if ((n(c['Individuals charged']) ?? 0) !== pi) warn(`${id}: "Individuals charged" = ${c['Individuals charged']} but defendants sum to ${pi}`);
  if ((n(c['Companies charged']) ?? 0) !== pc) warn(`${id}: "Companies charged" = ${c['Companies charged']} but defendants sum to ${pc}`);
  const stored = n(c['Months from conduct start to first action']);
  if (stored !== null && c['Conduct start (approx.)']) {
    const calc = (Date.parse(c['First official action (date)']) - Date.parse(c['Conduct start (approx.)'])) / 86400000 / 30.4375;
    if (Math.abs(calc - stored) > 0.15) warn(`${id}: stored months ${stored} vs computed ${calc.toFixed(1)}`);
  }
}
const defIds = new Set();
for (const d of defs) {
  const id = d['Defendant ID'];
  if (!/^DF-\d{3}$/.test(id)) fail(`bad Defendant ID "${id}"`);
  if (defIds.has(id)) fail(`duplicate Defendant ID ${id}`);
  defIds.add(id);
  if (!caseIds.has(d['Case ID'])) fail(`${id}: Case ID ${d['Case ID']} not in cases.csv`);
  if (!DEF_STATUS.includes(d['Current status'])) fail(`${id}: status "${d['Current status']}" not in codebook`);
  if (!['Individual', 'Company'].includes(d['Type'])) fail(`${id}: type "${d['Type']}" not in codebook`);
  if (!(people(d) >= 1)) fail(`${id}: Persons represented must be at least 1`);
  for (const k of ['Name (as reported)', 'Charges', 'Status as of', 'Last verified']) if (!d[k]) fail(`${id}: required field "${k}" blank`);
  if (d['Current status'] === 'Sentenced' && !(d['Sentence imposed (months)'] || '').trim()) fail(`${id}: Sentenced but no sentence recorded`);
}

// ---------- report ----------
console.log(`\nHeadline check (data as of ${asOf}):`);
for (const [k, v] of Object.entries(expectedDisplay)) console.log(`  ${k.padEnd(20)} ${v}`);
console.log(`  ${shown} headline values checked across ${html.length} pages.`);
warnings.forEach((w) => console.log(`  warning: ${w}`));
if (errors.length) {
  console.error(`\nFAILED: ${errors.length} problem(s):`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('  All checks passed.\n');
