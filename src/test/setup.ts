import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { sb } from "@/test/supabaseMock";
import { resetAuth } from "@/test/authMock";

// jsdom gaps used by Radix, the theme provider and page effects.
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.releasePointerCapture ??= () => {};
// Blob downloads (calendar reminder, status image).
URL.createObjectURL ??= vi.fn(() => "blob:mock");
URL.revokeObjectURL ??= vi.fn();
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  sb.reset();
  resetAuth();
  vi.clearAllMocks();
});
