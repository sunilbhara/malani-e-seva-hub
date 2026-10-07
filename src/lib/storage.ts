// localStorage that never throws (private mode, blocked storage, SSR).

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = globalThis.localStorage?.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the feature degrades to in-memory for this page view.
  }
}

export function removeKey(key: string): void {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch {
    // ignore
  }
}

/** Anonymous, random visitor id used for view/share counting and guest features. */
export function getVisitorId(): string {
  const key = "malani_visitor_id";
  try {
    const existing = globalThis.localStorage?.getItem(key);
    if (existing && /^[A-Za-z0-9-]{8,64}$/.test(existing)) return existing;
    const id = crypto.randomUUID();
    globalThis.localStorage?.setItem(key, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}
