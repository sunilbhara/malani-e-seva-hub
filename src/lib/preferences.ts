// Reader preferences (Blueprint §9.5). Stored locally for guests; synced to user_preferences after login.
import { readJson, writeJson } from "@/lib/storage";

export interface ReaderPreferences {
  qualification: string | null;
  departments: string[];
  district: string | null;
  completedAt: string | null;
  dismissedAt: string | null;
}

const KEY = "malani-preferences";
const EMPTY: ReaderPreferences = { qualification: null, departments: [], district: null, completedAt: null, dismissedAt: null };

export function loadPreferences(): ReaderPreferences {
  return { ...EMPTY, ...readJson<Partial<ReaderPreferences>>(KEY, {}) };
}

export function savePreferences(prefs: Partial<ReaderPreferences>): ReaderPreferences {
  const next = { ...loadPreferences(), ...prefs };
  writeJson(KEY, next);
  window.dispatchEvent(new CustomEvent("malani:preferences"));
  return next;
}

export function hasPreferences(prefs = loadPreferences()): boolean {
  return Boolean(prefs.qualification || prefs.departments.length);
}

/** Show the sheet on the second page view, never the first, and not again for 7 days after dismissal. */
export function shouldAskPreferences(pageViews: number, prefs = loadPreferences(), now = Date.now()): boolean {
  if (hasPreferences(prefs) || pageViews < 2) return false;
  if (prefs.dismissedAt && now - new Date(prefs.dismissedAt).getTime() < 7 * 86_400_000) return false;
  return true;
}

/** Push topics derived from preferences ("all" when nothing is chosen). */
export function topicsFor(prefs: ReaderPreferences): string[] {
  const topics = [prefs.qualification, ...prefs.departments].filter((t): t is string => Boolean(t));
  return topics.length ? topics : ["all"];
}
