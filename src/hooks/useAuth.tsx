import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { getUserRole, loadRemotePreferences, saveRemotePreferences } from "@/services/profile";
import { syncLocalSaves } from "@/services/engagement";
import { hasPreferences, loadPreferences, savePreferences } from "@/lib/preferences";

type Role = "admin" | "user" | null;

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ user: null, session: null, role: null, loading: true });

/** After sign-in: move guest saves into the account and reconcile reading preferences. */
async function onSignedIn(userId: string) {
  await syncLocalSaves(userId).catch(() => undefined);
  try {
    const remote = await loadRemotePreferences(userId);
    const local = loadPreferences();
    if (remote && (remote.qualification || remote.departments?.length)) {
      savePreferences({ ...remote, completedAt: local.completedAt ?? new Date().toISOString() });
    } else if (hasPreferences(local)) {
      await saveRemotePreferences(userId, local);
    }
  } catch {
    // Preferences are a convenience; never block sign-in on them.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [roleFor, setRoleFor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const syncedFor = useRef<string | null>(null);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setLoading(false);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Keyed on the user id (not the session object) so token refreshes don't refetch (audit B6).
  useEffect(() => {
    if (!userId) {
      setRole(null);
      setRoleFor(null);
      syncedFor.current = null;
      return;
    }
    let cancelled = false;
    getUserRole(userId)
      .catch(() => null)
      .then((r) => {
        if (cancelled) return;
        setRole(r);
        setRoleFor(userId);
      });
    if (syncedFor.current !== userId) {
      syncedFor.current = userId;
      void onSignedIn(userId);
    }
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const value = useMemo(
    () => ({ user: session?.user ?? null, session, role, loading: loading || (Boolean(userId) && roleFor !== userId) }),
    [session, role, loading, userId, roleFor],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
