import { describe, expect, it, vi } from "vitest";
import { clearLocalSaves, isSavedLocally, loadSavedIds, onSavedChange, saveLocally, unsaveLocally } from "@/lib/savedPosts";
import { hasPreferences, loadPreferences, savePreferences, shouldAskPreferences, topicsFor } from "@/lib/preferences";
import { getVisitorId, readJson, writeJson } from "@/lib/storage";

describe("guest saved posts (audit U6)", () => {
  it("saves, de-duplicates, removes and notifies", () => {
    const listener = vi.fn();
    const off = onSavedChange(listener);
    saveLocally("a");
    saveLocally("b");
    saveLocally("a");
    expect(loadSavedIds()).toEqual(["a", "b"]);
    expect(isSavedLocally("b")).toBe(true);
    unsaveLocally("b");
    expect(loadSavedIds()).toEqual(["a"]);
    clearLocalSaves();
    expect(loadSavedIds()).toEqual([]);
    expect(listener).toHaveBeenCalledTimes(5);
    off();
  });
  it("ignores corrupted storage", () => {
    localStorage.setItem("malani-saved-posts", '{"x":1}');
    expect(loadSavedIds()).toEqual([]);
    localStorage.setItem("malani-saved-posts", "not json");
    expect(loadSavedIds()).toEqual([]);
  });
});

describe("reader preferences (Blueprint 9.5)", () => {
  it("asks on the second page view only", () => {
    expect(shouldAskPreferences(1)).toBe(false);
    expect(shouldAskPreferences(2)).toBe(true);
  });
  it("waits 7 days after dismissal", () => {
    const now = Date.parse("2026-10-06T00:00:00Z");
    savePreferences({ dismissedAt: "2026-10-01T00:00:00Z" });
    expect(shouldAskPreferences(5, loadPreferences(), now)).toBe(false);
    expect(shouldAskPreferences(5, loadPreferences(), now + 3 * 86_400_000)).toBe(true);
  });
  it("never asks once filled, and derives push topics", () => {
    const prefs = savePreferences({ qualification: "graduate", departments: ["police"] });
    expect(hasPreferences(prefs)).toBe(true);
    expect(shouldAskPreferences(9, prefs)).toBe(false);
    expect(topicsFor(prefs)).toEqual(["graduate", "police"]);
    expect(topicsFor({ ...prefs, qualification: null, departments: [] })).toEqual(["all"]);
  });
});

describe("storage", () => {
  it("round-trips JSON and falls back", () => {
    writeJson("k", { a: 1 });
    expect(readJson("k", null)).toEqual({ a: 1 });
    expect(readJson("missing", 7)).toBe(7);
  });
  it("visitor id is stable", () => {
    const id = getVisitorId();
    expect(id.length).toBeGreaterThanOrEqual(16);
    expect(getVisitorId()).toBe(id);
  });
});
