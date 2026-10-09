import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { persistSnapshot, restoreSnapshot } from "@/lib/queryClient";

afterEach(() => {
  localStorage.clear();
  vi.useRealTimers();
});

describe("snapshot-first rendering", () => {
  it("saves only public list queries and restores them as stale data", async () => {
    vi.useFakeTimers();
    const a = new QueryClient();
    const stop = persistSnapshot(a);
    a.setQueryData(["posts", { k: "latest" }], { items: [{ id: "p1" }] });
    a.setQueryData(["catalog", "shop"], { products: [] });
    a.setQueryData(["admin", "todo"], { secret: true });
    a.setQueryData(["notifications", "u1"], [{ id: "n1" }]);
    vi.advanceTimersByTime(2000);
    stop();

    const saved = JSON.parse(localStorage.getItem("malani-snapshot-v1")!);
    expect(saved.entries.map((e: { key: unknown[] }) => e.key[0]).sort()).toEqual(["catalog", "posts"]);

    vi.useRealTimers();
    const b = new QueryClient({ defaultOptions: { queries: { staleTime: 60_000 } } });
    restoreSnapshot(b);
    expect(b.getQueryData(["posts", { k: "latest" }])).toEqual({ items: [{ id: "p1" }] });
    expect(b.getQueryData(["admin", "todo"])).toBeUndefined();
    // Restored data is stale, so pages refresh it in the background.
    expect(b.getQueryCache().find({ queryKey: ["posts", { k: "latest" }] })!.isStaleByTime(60_000)).toBe(true);
  });

  it("ignores snapshots older than a day and corrupt storage", () => {
    localStorage.setItem("malani-snapshot-v1", JSON.stringify({ at: Date.now() - 25 * 3600_000, entries: [{ key: ["posts", 1], data: 1, updatedAt: 0 }] }));
    const c = new QueryClient();
    restoreSnapshot(c);
    expect(c.getQueryData(["posts", 1])).toBeUndefined();
    localStorage.setItem("malani-snapshot-v1", "{not json");
    expect(() => restoreSnapshot(c)).not.toThrow();
  });
});
