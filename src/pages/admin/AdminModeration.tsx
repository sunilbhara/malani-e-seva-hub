import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Flag, MessageSquareReply, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteComment, getModerationQueue, moderateComment } from "@/services/comments";
import { queryKeys } from "@/lib/queryClient";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Reported and recent questions; reported ones first (audit S9). */
export default function AdminModeration() {
  const queryClient = useQueryClient();
  const queue = useQuery({ queryKey: queryKeys.moderation, queryFn: () => getModerationQueue(100) });

  async function act(fn: () => Promise<void>, message: string) {
    try {
      await fn();
      toast.success(message);
      void queryClient.invalidateQueries({ queryKey: queryKeys.moderation });
    } catch {
      toast.error("यह काम नहीं हो सका");
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="font-hindi text-2xl font-bold">सवाल और मॉडरेशन</h1>
      <p className="font-hindi text-small text-muted-foreground">3 रिपोर्ट होते ही सवाल अपने आप छिप जाता है। जवाब देने के लिए पोस्ट खोलें — एडमिन के जवाब अपने आप पिन होते हैं।</p>
      {queue.isLoading && <p className="font-hindi text-muted-foreground">लोड हो रहा है…</p>}
      {queue.data?.length === 0 && <p className="rounded-2xl border bg-card p-6 text-center font-hindi text-muted-foreground">अभी कोई सवाल नहीं।</p>}
      <ul className="space-y-3">
        {queue.data?.map((c) => (
          <li key={c.id} className={cn("rounded-2xl border bg-card p-4", c.reports > 0 && "border-destructive/50", c.is_hidden && "opacity-70")}>
            <div className="flex flex-wrap items-center gap-2 font-hindi text-caption font-normal text-muted-foreground">
              <span className="font-semibold text-foreground">{c.author?.full_name ?? "पाठक"}</span>
              <span>{timeAgo(c.created_at)}</span>
              {c.parent_id && <span className="rounded-full bg-muted px-2 py-0.5">जवाब</span>}
              {c.is_pinned && <span className="rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground">पिन</span>}
              {c.is_hidden && <span className="rounded-full bg-status-closed-bg px-2 py-0.5 text-status-closed">छिपा</span>}
              {c.reports > 0 && <span className="inline-flex items-center gap-1 rounded-full bg-status-urgent-bg px-2 py-0.5 text-status-urgent"><Flag className="h-3 w-3" /> {c.reports} रिपोर्ट</span>}
            </div>
            <p className="mt-2 whitespace-pre-wrap font-hindi text-body">{c.content}</p>
            {c.post && <Link to={`/blog/${c.post.slug}#qa`} className="mt-1 block truncate font-hindi text-small text-primary hover:underline">{c.post.title}</Link>}
            <div className="mt-3 flex flex-wrap gap-2">
              {c.post && <Button asChild size="sm" variant="outline" className="font-hindi"><Link to={`/blog/${c.post.slug}#qa`}><MessageSquareReply /> जवाब दें</Link></Button>}
              <Button size="sm" variant="outline" className="font-hindi" onClick={() => void act(() => moderateComment(c.id, { pinned: !c.is_pinned }), c.is_pinned ? "पिन हटाया" : "पिन किया")}>
                <Pin /> {c.is_pinned ? "पिन हटाएँ" : "पिन करें"}
              </Button>
              <Button size="sm" variant="outline" className="font-hindi" onClick={() => void act(() => moderateComment(c.id, { hidden: !c.is_hidden }), c.is_hidden ? "दिखाया गया" : "छिपाया गया")}>
                {c.is_hidden ? <Eye /> : <EyeOff />} {c.is_hidden ? "दिखाएँ" : "छिपाएँ"}
              </Button>
              <Button size="sm" variant="ghost" className="font-hindi text-destructive" onClick={() => void act(() => deleteComment(c.id), "हटा दिया गया")}>
                <Trash2 /> हटाएँ
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
