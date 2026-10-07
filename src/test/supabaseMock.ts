/* eslint-disable @typescript-eslint/no-explicit-any */
// Chainable stand-in for the Supabase client used by service unit tests.
// Every `from()` / `rpc()` call is recorded with the builder methods applied to it, and the
// awaited result comes from the most recently registered matching responder.
import { vi } from "vitest";

export interface Op {
  method: string;
  args: unknown[];
}

export interface QueryCall {
  kind: "from" | "rpc";
  name: string;
  args?: unknown;
  ops: Op[];
}

export interface QueryResult {
  data?: unknown;
  error?: unknown;
  count?: number | null;
}

type Matcher = Partial<Pick<QueryCall, "kind" | "name">> & { method?: string };
type Responder = (call: QueryCall) => QueryResult | undefined;

function matches(call: QueryCall, m: Matcher | ((c: QueryCall) => boolean)): boolean {
  if (typeof m === "function") return m(call);
  if (m.kind && m.kind !== call.kind) return false;
  if (m.name && m.name !== call.name) return false;
  if (m.method && !call.ops.some((o) => o.method === m.method)) return false;
  return true;
}

export function createSupabaseMock() {
  const calls: QueryCall[] = [];
  const responders: Responder[] = [];

  function resolve(call: QueryCall) {
    for (let i = responders.length - 1; i >= 0; i -= 1) {
      const r = responders[i](call);
      if (r) return { data: r.data ?? null, error: r.error ?? null, count: r.count ?? null };
    }
    return { data: null, error: null, count: null };
  }

  function chain(call: QueryCall): any {
    calls.push(call);
    const proxy: any = new Proxy(function noop() {}, {
      get(_target, prop) {
        if (prop === "then") {
          return (onOk: (v: unknown) => unknown, onErr?: (e: unknown) => unknown) =>
            Promise.resolve()
              .then(() => resolve(call))
              .then(onOk, onErr);
        }
        return (...args: unknown[]) => {
          call.ops.push({ method: String(prop), args });
          return proxy;
        };
      },
    });
    return proxy;
  }

  const authListeners: Array<(event: string, session: unknown) => void> = [];

  const supabase = {
    from: vi.fn((name: string) => chain({ kind: "from", name, ops: [] })),
    rpc: vi.fn((name: string, args?: unknown) => chain({ kind: "rpc", name, args, ops: [] })),
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      getUser: vi.fn(async () => ({ data: { user: null }, error: null })),
      onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
        authListeners.push(cb);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      }),
      signUp: vi.fn(async () => ({ data: {}, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
      signInWithOAuth: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({ error: null })),
      resetPasswordForEmail: vi.fn(async () => ({ data: {}, error: null })),
      updateUser: vi.fn(async () => ({ data: {}, error: null })),
    },
    functions: { invoke: vi.fn(async () => ({ data: null as unknown, error: null as unknown })) },
  };

  return {
    supabase,
    calls,
    /** Registers a result for matching calls (later registrations win). */
    on(m: Matcher | ((c: QueryCall) => boolean), result: QueryResult | ((c: QueryCall) => QueryResult)) {
      responders.push((c) => (matches(c, m) ? (typeof result === "function" ? result(c) : result) : undefined));
    },
    /** Calls matching a table/RPC name and optionally a builder method. */
    find(name: string, method?: string) {
      return calls.filter((c) => c.name === name && (!method || c.ops.some((o) => o.method === method)));
    },
    emitAuth(event: string, session: unknown) {
      authListeners.forEach((cb) => cb(event, session));
    },
    reset() {
      calls.length = 0;
      responders.length = 0;
      authListeners.length = 0;
    },
  };
}

/** Shared instance; `vi.mock("@/lib/supabase", ...)` in a test file returns `sb.supabase`. */
export const sb = createSupabaseMock();

/** The args of the first builder method called `method` on a recorded call. */
export function opArgs(call: QueryCall | undefined, method: string): unknown[] | undefined {
  return call?.ops.find((o) => o.method === method)?.args;
}
