import { METRICS, asOf } from '../../lib/metrics.js';
import { SITE } from '../../config.js';
export const GET = () =>
  new Response(
    JSON.stringify(
      {
        dataset: SITE.name,
        as_of: asOf,
        license: SITE.license,
        note: 'Charges are allegations. Every defendant is presumed innocent unless proven guilty.',
        numbers: METRICS.map(({ key, label, value, display, unit, definition, source }) => ({ key, label, value, display, unit: unit || null, definition, source })),
      },
      null,
      2
    ),
    { headers: { 'Content-Type': 'application/json; charset=utf-8' } }
  );
