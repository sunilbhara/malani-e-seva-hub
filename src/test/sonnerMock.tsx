/* eslint-disable react-refresh/only-export-components */
// Replacement for "sonner": vi.mock("sonner", () => import("@/test/sonnerMock"));
import { vi } from "vitest";

export const toast = Object.assign(vi.fn(), {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  warning: vi.fn(),
  message: vi.fn(),
  dismiss: vi.fn(),
});

export function Toaster() {
  return null;
}
