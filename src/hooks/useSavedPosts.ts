// One "saved jobs" API for guests (localStorage) and signed-in readers (bookmarks table).
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { listBookmarkIds, setBookmarked } from "@/services/engagement";
import { loadSavedIds, onSavedChange, saveLocally, unsaveLocally } from "@/lib/savedPosts";
import { queryKeys } from "@/lib/queryClient";
import { track } from "@/lib/analytics";

export function useSavedPosts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [localIds, setLocalIds] = useState<string[]>(loadSavedIds);

  useEffect(() => onSavedChange(() => setLocalIds(loadSavedIds())), []);

  const remote = useQuery({
    queryKey: queryKeys.bookmarks(user?.id ?? "guest"),
    queryFn: () => listBookmarkIds(user!.id),
    enabled: Boolean(user),
  });

  const ids = useMemo(() => (user ? remote.data ?? [] : localIds), [user, remote.data, localIds]);

  const toggle = useCallback(
    async (postId: string) => {
      const saved = ids.includes(postId);
      if (!user) {
        if (saved) unsaveLocally(postId);
        else saveLocally(postId);
        if (!saved) track("save_job", { guest: true });
        return !saved;
      }
      const key = queryKeys.bookmarks(user.id);
      queryClient.setQueryData<string[]>(key, (old = []) => (saved ? old.filter((id) => id !== postId) : [postId, ...old]));
      try {
        await setBookmarked(postId, user.id, !saved);
        if (!saved) track("save_job", { guest: false });
      } catch (error) {
        queryClient.setQueryData<string[]>(key, (old = []) => (saved ? [postId, ...old] : old.filter((id) => id !== postId)));
        throw error;
      }
      return !saved;
    },
    [ids, user, queryClient],
  );

  return { ids, isSaved: (id: string) => ids.includes(id), toggle, loading: Boolean(user) && remote.isLoading };
}
