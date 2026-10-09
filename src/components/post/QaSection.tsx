import { ListSkeleton } from "@/components/common/PageSpinner";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, EyeOff, Flag, MessageCircleQuestion, Pin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import {
  COMMENT_MAX,
  deleteComment,
  friendlyCommentError,
  getThreads,
  moderateComment,
  postComment,
  reportComment,
  type QaComment,
} from "@/services/comments";
import { queryKeys } from "@/lib/queryClient";
import { timeAgo } from "@/lib/format";
import { loginUrl } from "@/lib/url";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

function Avatar({ name }: { name: string }) {
  return (
    <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary font-hindi text-small font-bold text-secondary-foreground">
      {name.trim().charAt(0) || "प"}
    </span>
  );
}

function CommentBody({
  comment,
  isAdmin,
  canDelete,
  onChanged,
  userId,
}: {
  comment: QaComment;
  isAdmin: boolean;
  canDelete: boolean;
  onChanged: () => void;
  userId?: string;
}) {
  const name = comment.author?.full_name || "पाठक";
  const answer = comment.parent_id !== null && comment.isAdminAnswer;

  async function act(fn: () => Promise<void>, success: string) {
    try {
      await fn();
      toast.success(success);
      onChanged();
    } catch {
      toast.error("यह काम नहीं हो सका।");
    }
  }

  return (
    <div className={cn("flex gap-3", comment.is_hidden && "opacity-60")}>
      <Avatar name={name} />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-hindi text-small">
          <span className="font-semibold text-foreground">{name}</span>
          {answer && (
            <span className="inline-flex items-center gap-1 rounded-full bg-status-open-bg px-2 py-0.5 text-caption text-status-open">
              <BadgeCheck className="h-3.5 w-3.5" /> उत्तर — मालाणी टीम
            </span>
          )}
          {comment.is_pinned && <Pin aria-label="पिन किया गया" className="h-3.5 w-3.5 text-primary" />}
          {comment.is_hidden && <span className="text-caption text-destructive">छिपा हुआ</span>}
          <span className="text-caption font-normal text-muted-foreground">{timeAgo(comment.created_at)}</span>
        </p>
        <p className="mt-1 whitespace-pre-wrap break-words font-hindi text-body text-body">{comment.content}</p>
        <div className="mt-1.5 flex flex-wrap gap-3 text-caption font-normal text-muted-foreground">
          {userId && userId !== comment.user_id && !isAdmin && (
            <button type="button" onClick={() => void act(() => reportComment(comment.id, userId), "रिपोर्ट भेज दी गई। धन्यवाद।")} className="inline-flex items-center gap-1 hover:text-foreground">
              <Flag className="h-3.5 w-3.5" /> रिपोर्ट
            </button>
          )}
          {canDelete && (
            <button type="button" onClick={() => void act(() => deleteComment(comment.id), "हटा दिया गया")} className="inline-flex items-center gap-1 hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> हटाएँ
            </button>
          )}
          {isAdmin && (
            <>
              <button type="button" onClick={() => void act(() => moderateComment(comment.id, { pinned: !comment.is_pinned }), comment.is_pinned ? "पिन हटाया" : "पिन किया")} className="inline-flex items-center gap-1 hover:text-foreground">
                <Pin className="h-3.5 w-3.5" /> {comment.is_pinned ? "पिन हटाएँ" : "पिन करें"}
              </button>
              <button type="button" onClick={() => void act(() => moderateComment(comment.id, { hidden: !comment.is_hidden }), comment.is_hidden ? "दिखाया गया" : "छिपाया गया")} className="inline-flex items-center gap-1 hover:text-foreground">
                <EyeOff className="h-3.5 w-3.5" /> {comment.is_hidden ? "दिखाएँ" : "छिपाएँ"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/** Comments reframed as "सवाल पूछें" with pinned admin answers (Blueprint Loop 6). */
export function QaSection({ postId, returnPath }: { postId: string; returnPath: string }) {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  const threads = useQuery({ queryKey: queryKeys.threads(postId), queryFn: () => getThreads(postId) });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: queryKeys.threads(postId) });

  async function submit(e: FormEvent, content: string, parentId: string | null) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    try {
      await postComment({ postId, userId: user.id, content, parentId });
      track("comment_posted", { reply: Boolean(parentId) });
      if (parentId) {
        setReply("");
        setReplyTo(null);
      } else {
        setQuestion("");
      }
      toast.success(parentId ? "जवाब पोस्ट हो गया" : "सवाल पोस्ट हो गया। जवाब आने पर आपको सूचना मिलेगी।");
      refresh();
    } catch (error) {
      toast.error(friendlyCommentError(error));
    } finally {
      setBusy(false);
    }
  }

  const count = threads.data?.length ?? 0;

  return (
    <section aria-labelledby="qa-heading" className="scroll-mt-24" id="qa">
      <h2 id="qa-heading" className="flex items-center gap-2 font-hindi text-xl font-bold">
        <MessageCircleQuestion aria-hidden className="h-6 w-6 text-primary" /> सवाल-जवाब
        {count > 0 && <span className="rounded-full bg-secondary px-2 py-0.5 text-caption text-secondary-foreground tabular">{count}</span>}
      </h2>
      <p className="mt-1 font-hindi text-small text-muted-foreground">इस भर्ती के बारे में सवाल पूछें — हमारी टीम जवाब देगी।</p>

      {user ? (
        <form onSubmit={(e) => void submit(e, question, null)} className="mt-4 space-y-2">
          <label htmlFor="qa-question" className="sr-only">आपका सवाल</label>
          <Textarea
            id="qa-question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={COMMENT_MAX}
            placeholder="जैसे: क्या 12वीं के रिजल्ट का इंतज़ार कर रहे छात्र आवेदन कर सकते हैं?"
            className="min-h-[96px] font-hindi text-body"
          />
          <div className="flex items-center justify-between">
            <span className="text-caption font-normal text-muted-foreground tabular">{question.length}/{COMMENT_MAX}</span>
            <Button type="submit" disabled={busy || !question.trim()} className="font-hindi">
              {busy ? "पोस्ट हो रहा है…" : "सवाल पूछें"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border bg-card p-4 sm:flex-row sm:items-center">
          <p className="flex-1 font-hindi text-small text-body">सवाल पूछने और जवाब की सूचना पाने के लिए साइन इन करें।</p>
          <Button asChild className="font-hindi">
            <Link to={loginUrl(`${returnPath}#qa`)}>साइन इन करें</Link>
          </Button>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {threads.isLoading && <ListSkeleton rows={2} />}
        {threads.data?.length === 0 && (
          <p className="rounded-2xl bg-muted/60 px-4 py-6 text-center font-hindi text-small text-muted-foreground">अभी कोई सवाल नहीं। पहला सवाल आप पूछें!</p>
        )}
        {threads.data?.map((t) => (
          <article key={t.id} className="rounded-2xl border bg-card p-4">
            <CommentBody comment={t} isAdmin={isAdmin} canDelete={isAdmin || user?.id === t.user_id} onChanged={refresh} userId={user?.id} />
            {t.replies.length > 0 && (
              <div className="mt-4 space-y-4 border-l-2 border-primary/30 pl-4 sm:ml-12">
                {t.replies.map((r) => (
                  <CommentBody key={r.id} comment={r} isAdmin={isAdmin} canDelete={isAdmin || user?.id === r.user_id} onChanged={refresh} userId={user?.id} />
                ))}
              </div>
            )}
            {user && (
              <div className="mt-3 sm:ml-12">
                {replyTo === t.id ? (
                  <form onSubmit={(e) => void submit(e, reply, t.id)} className="space-y-2">
                    <Textarea value={reply} onChange={(e) => setReply(e.target.value)} maxLength={COMMENT_MAX} placeholder="जवाब लिखें…" className="min-h-[72px] font-hindi" autoFocus />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={busy || !reply.trim()} className="font-hindi">जवाब दें</Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setReplyTo(null)} className="font-hindi">रद्द करें</Button>
                    </div>
                  </form>
                ) : (
                  <button type="button" onClick={() => setReplyTo(t.id)} className="font-hindi text-small font-semibold text-primary">
                    जवाब दें
                  </button>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
