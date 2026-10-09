import { QueryClient, type QueryKey } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  posts: (params: unknown) => ["posts", params] as const,
  post: (identifier: string) => ["post", identifier] as const,
  related: (id: string) => ["related", id] as const,
  threads: (postId: string) => ["threads", postId] as const,
  notifications: (userId: string) => ["notifications", userId] as const,
  unread: (userId: string) => ["unread", userId] as const,
  bookmarks: (userId: string) => ["bookmarks", userId] as const,
  liked: (postId: string, userId: string) => ["liked", postId, userId] as const,
  follows: (userId: string) => ["follows", userId] as const,
  reminders: (userId: string) => ["reminders", userId] as const,
  quiz: (date: string) => ["quiz", date] as const,
  catalog: (kind: string) => ["catalog", kind] as const,
  adminCatalog: (kind: string) => ["admin", "catalog", kind] as const,
  adminPosts: (params: unknown) => ["admin", "posts", params] as const,
  analytics: ["admin", "analytics"] as const,
  adminTodo: ["admin", "todo"] as const,
  moderation: ["admin", "moderation"] as const,
  adminIds: ["admin", "ids"] as const,
};

// --- Snapshot-first rendering (Phase 5) ----------------------------------------------------
// Public lists (job feeds, shop catalog) are saved to localStorage so a returning reader sees them
// instantly; they are marked stale and refreshed in the background. Nothing personal or admin-only
// is stored (only these query roots), and the snapshot expires after a day.
const SNAPSHOT_KEY = "malani-snapshot-v1";
const SNAPSHOT_ROOTS = new Set(["posts", "catalog", "listing"]);
const SNAPSHOT_MAX_AGE = 24 * 60 * 60 * 1000;
const SNAPSHOT_MAX_CHARS = 350_000;

interface SnapshotEntry {
  key: QueryKey;
  data: unknown;
  updatedAt: number;
}

export function restoreSnapshot(client: QueryClient): void {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return;
    const { at, entries } = JSON.parse(raw) as { at: number; entries: SnapshotEntry[] };
    if (!Array.isArray(entries) || Date.now() - at > SNAPSHOT_MAX_AGE) return;
    for (const e of entries) {
      if (SNAPSHOT_ROOTS.has(String(e.key?.[0]))) client.setQueryData(e.key, e.data, { updatedAt: Math.min(e.updatedAt, Date.now() - 61_000) });
    }
  } catch {
    // corrupt or blocked storage: start fresh
  }
}

export function persistSnapshot(client: QueryClient): () => void {
  let timer: number | undefined;
  const save = () => {
    try {
      let entries: SnapshotEntry[] = client
        .getQueryCache()
        .getAll()
        .filter((q) => SNAPSHOT_ROOTS.has(String(q.queryKey[0])) && q.state.status === "success" && q.state.data !== undefined)
        .sort((a, b) => b.state.dataUpdatedAt - a.state.dataUpdatedAt)
        .slice(0, 20)
        .map((q) => ({ key: q.queryKey, data: q.state.data, updatedAt: q.state.dataUpdatedAt }));
      let raw = JSON.stringify({ at: Date.now(), entries });
      while (raw.length > SNAPSHOT_MAX_CHARS && entries.length > 1) {
        entries = entries.slice(0, -1);
        raw = JSON.stringify({ at: Date.now(), entries });
      }
      if (raw.length <= SNAPSHOT_MAX_CHARS) localStorage.setItem(SNAPSHOT_KEY, raw);
    } catch {
      // storage full or blocked: skip
    }
  };
  const unsubscribe = client.getQueryCache().subscribe((event) => {
    if (event.type !== "updated" || !SNAPSHOT_ROOTS.has(String(event.query.queryKey[0]))) return;
    window.clearTimeout(timer);
    timer = window.setTimeout(save, 1500);
  });
  return () => {
    unsubscribe();
    window.clearTimeout(timer);
  };
}
