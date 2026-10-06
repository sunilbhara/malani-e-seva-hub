import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/hooks/useAuth";
import { listNotifications, markNotificationsRead, unreadCount } from "@/services/notifications";
import { queryKeys } from "@/lib/queryClient";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Bell with an unread dot; links each notification to its post (audit B3). */
export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const unread = useQuery({
    queryKey: queryKeys.unread(user?.id ?? ""),
    queryFn: () => unreadCount(user!.id),
    enabled: Boolean(user),
    refetchInterval: 5 * 60_000,
  });
  const list = useQuery({
    queryKey: queryKeys.notifications(user?.id ?? ""),
    queryFn: () => listNotifications(user!.id),
    enabled: Boolean(user) && open,
  });

  if (!user) return null;
  const count = unread.data ?? 0;

  async function markAll() {
    await markNotificationsRead().catch(() => undefined);
    void queryClient.invalidateQueries({ queryKey: queryKeys.unread(user!.id) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(user!.id) });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative grid h-11 w-11 place-items-center rounded-full text-foreground transition-colors hover:bg-muted"
          aria-label={count ? `सूचनाएँ, ${count} नई` : "सूचनाएँ"}
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 grid min-w-[1.125rem] place-items-center rounded-full bg-destructive px-1 text-[0.6875rem] font-bold leading-[1.125rem] text-destructive-foreground tabular">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="font-hindi font-semibold">सूचनाएँ</p>
          {count > 0 && (
            <button type="button" onClick={() => void markAll()} className="inline-flex items-center gap-1 text-small font-semibold text-primary">
              <CheckCheck className="h-4 w-4" /> सब पढ़ा
            </button>
          )}
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {list.isLoading && <p className="px-4 py-6 text-center font-hindi text-small text-muted-foreground">लोड हो रहा है…</p>}
          {list.data && list.data.length === 0 && (
            <p className="px-4 py-8 text-center font-hindi text-small text-muted-foreground">अभी कोई सूचना नहीं है।</p>
          )}
          <ul>
            {list.data?.map((n) => (
              <li key={n.id} className="border-b last:border-0">
                <Link
                  to={n.post ? `/blog/${n.post.slug}` : "/my"}
                  onClick={() => {
                    setOpen(false);
                    if (!n.read_at) void markNotificationsRead([n.id]).then(() => queryClient.invalidateQueries({ queryKey: queryKeys.unread(user.id) }));
                  }}
                  className={cn("block px-4 py-3 transition-colors hover:bg-muted", !n.read_at && "bg-secondary/40")}
                >
                  <p className="line-clamp-2 font-hindi text-small font-semibold text-foreground">{n.title}</p>
                  {n.body && <p className="mt-0.5 line-clamp-2 font-hindi text-caption font-normal text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-caption font-normal text-muted-foreground">{timeAgo(n.created_at)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </PopoverContent>
    </Popover>
  );
}
