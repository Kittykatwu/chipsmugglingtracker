// Headline numbers, computed from the CSVs at build time.
// scripts/check-headlines.mjs recomputes each one independently and fails the
// build if a page shows anything different. Change a definition here and there.
import {
  cases, defendants, C, D, num, persons, isIndividual, isCompany,
  monthsBetween, PLEA_GUILTY,
} from './data.js';
import { fmtMoney, fmtDate } from './format.js';

const sum = (arr) => arr.reduce((a, b) => a + b, 0);

export const asOf = [...cases.map((c) => c[C.lastVerified]), ...defendants.map((d) => d[D.lastVerified])]
  .filter(Boolean)
  .sort()
  .at(-1);

const individuals = defendants.filter(isIndividual);

const individualsCharged = sum(individuals.map(persons));
const companiesCharged = sum(defendants.filter(isCompany).map(persons));
const countries = [...new Set(individuals.map((d) => d[D.country]).filter(Boolean))].sort();
const guiltyPleas = sum(individuals.filter((d) => PLEA_GUILTY.test(d[D.plea] || '')).map(persons));
const sentenced = sum(individuals.filter((d) => d[D.status] === 'Sentenced').map(persons));
const reachedRows = cases.filter((c) => num(c[C.reachedChina]) !== null && num(c[C.reachedChina]) > 0);
const reachedChina = sum(reachedRows.map((c) => num(c[C.reachedChina])));
const monthRows = cases
  .map((c) => ({ id: c[C.id], m: monthsBetween(c[C.conductStart], c[C.firstAction]) }))
  .filter((r) => r.m !== null);
const avgMonths = monthRows.length ? Math.round((sum(monthRows.map((r) => r.m)) / monthRows.length) * 10) / 10 : null;

export const METRICS = [
  {
    key: 'individuals-charged',
    label: 'Individuals charged worldwide',
    value: individualsCharged,
    display: String(individualsCharged),
    definition:
      `People (not companies) charged in a tracked case, in any country. Counted by summing "Persons represented" in the defendants table, because one Taiwan row groups unnamed co-defendants. ${companiesCharged} companies have also been charged and are not included.`,
    source: 'defendants.csv',
  },
  {
    key: 'countries',
    label: 'Countries where people have been charged',
    value: countries.length,
    display: String(countries.length),
    definition: `Distinct prosecuting countries with at least one individual charged: ${countries.join(', ')}. Countries with seizures but no charges are not counted.`,
    source: 'defendants.csv',
  },
  {
    key: 'guilty-pleas',
    label: 'Guilty pleas',
    value: guiltyPleas,
    display: String(guiltyPleas),
    definition:
      'Individuals whose recorded plea is guilty. Each plea links to its source on the case page. Company pleas, and confessions that are not formal guilty pleas, are not counted.',
    source: 'defendants.csv',
  },
  {
    key: 'sentences',
    label: 'Sentences confirmed in public sources',
    value: sentenced,
    display: String(sentenced),
    definition:
      'Individuals whose status is "Sentenced". A sentence counts only once it is confirmed by a court record or official release. Zero can mean a sentencing has not been reported, not that none has happened.',
    source: 'defendants.csv',
  },
  {
    key: 'reached-china',
    label: 'Value alleged by authorities to have reached China',
    value: reachedChina,
    display: fmtMoney(reachedChina),
    definition:
      `Sum of the dollar value that prosecutors or other authorities say actually reached China, across the ${reachedRows.length} cases where they state one (${reachedRows.map((c) => c[C.id]).join(', ')}). These are allegations, not proven amounts. Order values, wire transfers and seizures are never added in.`,
    source: 'cases.csv',
  },
  {
    key: 'months-to-action',
    label: 'Average months from start of alleged scheme to first official action',
    value: avgMonths,
    display: avgMonths === null ? 'n/a' : avgMonths.toFixed(1),
    unit: 'months',
    definition:
      `Unweighted average, across the ${monthRows.length} cases with both dates, of the time from the approximate start of the alleged conduct to the first public official action (arrest, charge or indictment). Start dates are approximate to the month. Seizures without a scheme start date are excluded.`,
    source: 'cases.csv',
  },
];

export const asOfDisplay = fmtDate(asOf);
export const extra = { companiesCharged, countries, monthRows, reachedRows };
