/**
 * Shared display formatters.
 */

/**
 * Format a database date for display.
 *
 * Postgres DATE columns come back as ISO strings like
 * "2026-09-15T00:00:00.000Z". Running those through `new Date()` and then
 * `toLocaleDateString()` shifts them into the local timezone, which can move
 * the date back a day (e.g. Sept 15 → Sept 14 in Toronto). So for anything
 * that starts with YYYY-MM-DD we build the date in local time from the parts
 * and never do a timezone conversion.
 */
export function fmtDate(value) {
  if (!value) return '';
  const s = String(value);
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Whole-dollar money label, e.g. 1500 → "$1,500". */
export function fmtMoney(n) {
  if (n == null || n === '' || isNaN(n)) return null;
  return '$' + Number(n).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

/** "$1,500.00" style, for ledgers. */
export function fmtMoneyExact(n) {
  if (n == null || n === '' || isNaN(n)) return '—';
  return '$' + Number(n).toFixed(2);
}
