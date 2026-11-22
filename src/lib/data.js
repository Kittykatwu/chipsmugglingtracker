// Loads data/cases.csv and data/defendants.csv at build time.
// Every page reads from here; no case data lives in templates.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const DATA_DIR = path.join(process.cwd(), 'data');

export function readRaw(name) {
  return fs.readFileSync(path.join(DATA_DIR, name), 'utf8');
}

function load(name) {
  return parse(readRaw(name), { columns: true, skip_empty_lines: true, trim: true, bom: true });
}

export const C = {
  id: 'Case ID',
  name: 'Case name',
  country: 'Prosecuting country',
  court: 'Court / authority',
  docket: 'Docket / reference',
  conductStart: 'Conduct start (approx.)',
  firstAction: 'First official action (date)',
  months: 'Months from conduct start to first action',
  status: 'Case status',
  hardware: 'Hardware named',
  transit: 'Transit countries named',
  destination: 'Destination named',
  headline: 'Headline value cited (USD)',
  headlineBasis: 'What the headline value measures',
  reachedChina: 'Value alleged to have reached China (USD)',
  units: 'Units (as described)',
  funds: 'Funds received from abroad for the scheme (USD)',
  seized: 'Seized / forfeited (USD)',
  individuals: 'Individuals charged',
  companies: 'Companies charged',
  insider: 'Insider at a major chip or server firm?',
  detected: 'How detected (primary)',
  charges: 'Charges / legal basis',
  methods: 'Methods described',
  notes: 'Notes, disputes & open questions',
  primaryDoc: 'Primary document obtained?',
  source1: 'Source 1',
  source2: 'Source 2',
  lastVerified: 'Last verified',
};

export const D = {
  id: 'Defendant ID',
  caseId: 'Case ID',
  name: 'Name (as reported)',
  persons: 'Persons represented',
  type: 'Type',
  country: 'Prosecuting country',
  role: 'Role in scheme',
  affiliation: 'Affiliation / background (as reported)',
  charges: 'Charges',
  maxYears: 'Max statutory exposure, top count (years)',
  plea: 'Plea',
  custody: 'Custody / bail',
  status: 'Current status',
  statusAsOf: 'Status as of',
  sentenceMonths: 'Sentence imposed (months)',
  sentenceSought: 'Sentence sought by prosecutors',
  nextEvent: 'Next event',
  notes: 'Notes',
  source: 'Source',
  lastVerified: 'Last verified',
};

export const cases = load('cases.csv');
export const defendants = load('defendants.csv');

// ---------- helpers ----------
export const num = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v).replace(/[$,\s]/g, '');
  if (s === '') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

export const persons = (d) => num(d[D.persons]) ?? 1;
export const isIndividual = (d) => d[D.type] === 'Individual';
export const isCompany = (d) => d[D.type] === 'Company';

export const defendantsFor = (caseId) => defendants.filter((d) => d[D.caseId] === caseId);
export const caseById = (id) => cases.find((c) => c[C.id] === id);

// Hardware vocabulary used for filters and the hardware chart.
const HW_PATTERNS = [
  ['A100', /\bA100\b/i],
  ['H100', /\bH100\b/i],
  ['H200', /\bH200\b/i],
  ['B200', /\bB200\b/i],
  ['B300', /\bB300\b/i],
  ['RTX (consumer GPU)', /\bRTX\b/i],
];
export const HARDWARE_TERMS = [...HW_PATTERNS.map(([k]) => k), 'Model not specified'];
export function hardwareTags(c) {
  const t = c[C.hardware] || '';
  const tags = HW_PATTERNS.filter(([, re]) => re.test(t)).map(([k]) => k);
  return tags.length ? tags : ['Model not specified'];
}

// Transit countries: split on ";", drop parentheticals; skip "not specified"
// entries and regions that do not name a country.
const REGION_TERMS = [/^southeast asia$/i];
export function transitCountries(c) {
  return (c[C.transit] || '')
    .split(';')
    .map((s) => s.replace(/\(.*?\)/g, '').trim())
    .filter((s) => s && !/^not specified/i.test(s) && !REGION_TERMS.some((re) => re.test(s)));
}

// China (incl. Hong Kong) named as destination?
export const destinationIsChina = (c) => /china|hong kong/i.test(c[C.destination] || '');

export const isSeizureOnly = (c) => /^seizure/i.test(c[C.status] || '');

// Months between two ISO dates using an average month length (matches the workbook).
export function monthsBetween(a, b) {
  if (!a || !b) return null;
  const ms = Date.parse(b) - Date.parse(a);
  if (!Number.isFinite(ms)) return null;
  return ms / 86400000 / 30.4375;
}

export const PLEA_GUILTY = /^guilty/i;
