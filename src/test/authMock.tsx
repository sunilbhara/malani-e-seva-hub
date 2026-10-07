/* eslint-disable react-refresh/only-export-components */
// Replacement for "@/hooks/useAuth" in component/page tests:
//   vi.mock("@/hooks/useAuth", () => import("@/test/authMock"));
import type { ReactNode } from "react";

type Role = "admin" | "user" | null;

interface AuthState {
  user: { id: string; email: string } | null;
  session: unknown;
  role: Role;
  loading: boolean;
}

const GUEST: AuthState = { user: null, session: null, role: null, loading: false };

export const auth: AuthState = { ...GUEST };

export function setAuth(next: Partial<AuthState>) {
  Object.assign(auth, GUEST, next);
}

export function signIn(role: Exclude<Role, null> = "user", id = "user-1") {
  setAuth({ user: { id, email: `${id}@example.test` }, session: { user: { id } }, role });
}

export function resetAuth() {
  setAuth({});
}

export function useAuth() {
  return auth;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
