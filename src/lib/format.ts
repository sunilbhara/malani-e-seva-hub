// Hindi-first formatting helpers. Numbers use international digits (faster to scan, Blueprint §3).

const MONTHS_HI = ["जन", "फर", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अग", "सितं", "अक्टू", "नवं", "दिसं"];
const MONTHS_HI_LONG = ["जनवरी", "फरवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

/** Today's date in India as YYYY-MM-DD. */
export function istToday(now = new Date()): string {
  return new Date(now.getTime() + 330 * 60_000).toISOString().slice(0, 10);
}

function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** "25 अक्टू 2026" for a YYYY-MM-DD date (no timezone shift). */
export function formatDate(iso: string | null | undefined, opts: { long?: boolean; withYear?: boolean } = {}): string {
  if (!iso) return "";
  const p = parseIsoDate(iso);
  if (!p) return "";
  const month = (opts.long ? MONTHS_HI_LONG : MONTHS_HI)[p.m - 1];
  return opts.withYear === false ? `${p.d} ${month}` : `${p.d} ${month} ${p.y}`;
}

/** Date + time in IST for timestamps, e.g. "5 अक्टू 2026, 3:40 PM". */
export function formatDateTime(ts: string | null | undefined): string {
  if (!ts) return "";
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const ist = new Date(date.getTime() + 330 * 60_000);
  const iso = ist.toISOString();
  let hours = ist.getUTCHours();
  const minutes = String(ist.getUTCMinutes()).padStart(2, "0");
  const suffix = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${formatDate(iso.slice(0, 10))}, ${hours}:${minutes} ${suffix}`;
}

/** Calendar date (IST) of a timestamp. */
export function istDateOf(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const date = new Date(ts);
  return Number.isNaN(date.getTime()) ? null : istToday(date);
}

/** Relative time in Hindi: "अभी", "5 मिनट पहले", "3 घंटे पहले", "कल", "4 दिन पहले", else a date. */
export function timeAgo(ts: string | null | undefined, now = new Date()): string {
  if (!ts) return "";
  const then = new Date(ts).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Math.max(0, now.getTime() - then);
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "अभी";
  if (minutes < 60) return `${minutes} मिनट पहले`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} घंटे पहले`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "कल";
  if (days < 7) return `${days} दिन पहले`;
  return formatDate(istDateOf(ts));
}

/** Whole days from today (IST) until an ISO date; negative when past. */
export function daysUntil(iso: string | null | undefined, today = istToday()): number | null {
  const target = iso ? parseIsoDate(iso) : null;
  const base = parseIsoDate(today);
  if (!target || !base) return null;
  const diff = Date.UTC(target.y, target.m - 1, target.d) - Date.UTC(base.y, base.m - 1, base.d);
  return Math.round(diff / 86_400_000);
}

export function formatNumber(n: number | null | undefined): string {
  return typeof n === "number" ? n.toLocaleString("en-IN") : "";
}

export function formatRupees(n: number | null | undefined): string {
  if (typeof n !== "number") return "";
  return n === 0 ? "निःशुल्क" : `₹${n.toLocaleString("en-IN")}`;
}
