// "Recent developments": built from each defendant's "Status as of" date and
// each case's "First official action" date. Newest first.
import { cases, defendants, C, D, caseById } from './data.js';

export function developments(limit = 5) {
  const byKey = new Map();
  for (const d of defendants) {
    const date = d[D.statusAsOf];
    if (!date) continue;
    const key = `${d[D.caseId]}|${date}|${d[D.status]}`;
    if (!byKey.has(key)) byKey.set(key, { date, caseId: d[D.caseId], status: d[D.status], names: [], kind: 'status' });
    byKey.get(key).names.push(d[D.name]);
  }
  const items = [...byKey.values()];
  for (const c of cases) {
    const date = c[C.firstAction];
    if (!date) continue;
    if (items.some((i) => i.caseId === c[C.id] && i.date === date)) continue;
    items.push({ date, caseId: c[C.id], status: c[C.status], names: [], kind: 'first-action' });
  }
  return items
    .sort((a, b) => b.date.localeCompare(a.date) || a.caseId.localeCompare(b.caseId))
    .slice(0, limit)
    .map((i) => ({ ...i, caseName: caseById(i.caseId)?.[C.name] ?? i.caseId }));
}
