// Guest saves (audit U6): readers can save jobs without an account; synced to bookmarks after login.
import { readJson, writeJson } from "@/lib/storage";

const KEY = "malani-saved-posts";
const EVENT = "malani:saved";

export function loadSavedIds(): string[] {
  const ids = readJson<unknown>(KEY, []);
  return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
}

function store(ids: string[]) {
  writeJson(KEY, Array.from(new Set(ids)).slice(0, 500));
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function isSavedLocally(id: string): boolean {
  return loadSavedIds().includes(id);
}

export function saveLocally(id: string): void {
  store([id, ...loadSavedIds()]);
}

export function unsaveLocally(id: string): void {
  store(loadSavedIds().filter((x) => x !== id));
}

export function clearLocalSaves(): void {
  store([]);
}

export function onSavedChange(callback: () => void): () => void {
  const handler = () => callback();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
