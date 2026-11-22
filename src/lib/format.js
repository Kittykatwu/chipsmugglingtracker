// Formatting helpers shared by pages (and mirrored in scripts/check-headlines.mjs).
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function fmtDate(iso) {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`;
}

// $881.2 million / $28.5 million / $950,000 / $0
export function fmtMoney(n) {
  if (n === null || n === undefined || Number.isNaN(n)) return '';
  if (n >= 1e9) return `$${trim(n / 1e9)} billion`;
  if (n >= 1e6) return `$${trim(n / 1e6)} million`;
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function trim(x) {
  return (Math.round(x * 10) / 10).toFixed(1).replace(/\.0$/, '');
}

export function fmtCount(n, singular, plural = singular + 's') {
  return `${n} ${n === 1 ? singular : plural}`;
}

export const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// "12.03" -> "12 months and 1 day"; non-numeric text (e.g. "Time served") is shown as-is.
export function fmtSentence(v) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  const whole = Math.floor(n);
  const days = Math.round((n - whole) * 30.4375);
  const m = `${whole} ${whole === 1 ? 'month' : 'months'}`;
  return days ? `${m} and ${days} ${days === 1 ? 'day' : 'days'}` : m;
}
