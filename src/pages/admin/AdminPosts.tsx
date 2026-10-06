import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deletePost, listAdminPosts, type AdminPostRow, type PostStatus } from "@/services/posts";
import { queryKeys } from "@/lib/queryClient";
import { formatDateTime, formatNumber } from "@/lib/format";
import { postTypeShort } from "@/lib/jobs";
import { cn } from "@/lib/utils";

const STATUS: Record<PostStatus, { label: string; className: string }> = {
  published: { label: "प्रकाशित", className: "bg-status-open-bg text-status-open" },
  draft: { label: "ड्राफ़्ट", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "शेड्यूल", className: "bg-secondary text-secondary-foreground" },
  archived: { label: "आर्काइव", className: "bg-status-closed-bg text-status-closed" },
};
const PAGE = 25;

export default function AdminPosts() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<PostStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [toDelete, setToDelete] = useState<AdminPostRow | null>(null);

  const params = { status, search, offset: page * PAGE, limit: PAGE };
  const posts = useQuery({ queryKey: queryKeys.adminPosts(params), queryFn: () => listAdminPosts(params) });
  const total = posts.data?.total ?? 0;

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await deletePost(toDelete.id);
      toast.success("पोस्ट हटा दी गई");
      setToDelete(null);
      void queryClient.invalidateQueries({ queryKey: ["admin"] });
    } catch {
      toast.error("पोस्ट हटाई नहीं जा सकी");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hindi text-2xl font-bold">पोस्ट <span className="text-muted-foreground tabular">({total})</span></h1>
        <Button asChild className="font-hindi"><Link to="/admin/posts/new">नई पोस्ट</Link></Button>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input placeholder="शीर्षक से खोजें…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="h-11 font-hindi sm:max-w-xs" />
        <div className="flex flex-wrap gap-1">
          {(["all", "published", "draft", "scheduled", "archived"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { setStatus(s); setPage(0); }}
              aria-pressed={status === s}
              className={cn("h-11 rounded-lg border px-3 font-hindi text-small font-semibold", status === s ? "border-primary bg-primary text-primary-foreground" : "bg-card")}
            >
              {s === "all" ? "सभी" : STATUS[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border bg-card">
        <table className="w-full min-w-[720px] text-small">
          <thead>
            <tr className="border-b text-left font-hindi text-muted-foreground">
              <th className="px-4 py-3 font-medium">शीर्षक</th>
              <th className="px-3 py-3 font-medium">स्थिति</th>
              <th className="px-3 py-3 font-medium">अपडेट</th>
              <th className="px-3 py-3 text-right font-medium">व्यू</th>
              <th className="px-3 py-3 text-right font-medium">सवाल</th>
              <th className="px-3 py-3"><span className="sr-only">कार्य</span></th>
            </tr>
          </thead>
          <tbody>
            {posts.isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center font-hindi text-muted-foreground">लोड हो रहा है…</td></tr>
            )}
            {posts.data?.items.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="max-w-[22rem] px-4 py-3">
                  <p className="truncate font-hindi font-medium">{p.title}</p>
                  <p className="font-hindi text-caption font-normal text-muted-foreground">{postTypeShort(p.post_type)} · {p.category}</p>
                </td>
                <td className="px-3 py-3"><span className={cn("rounded-full px-2.5 py-1 font-hindi text-caption", STATUS[p.status]?.className)}>{STATUS[p.status]?.label ?? p.status}</span>
                  {p.status === "scheduled" && p.scheduled_at && <p className="mt-1 text-caption font-normal text-muted-foreground">{formatDateTime(p.scheduled_at)}</p>}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-caption font-normal text-muted-foreground">{formatDateTime(p.updated_at)}</td>
                <td className="px-3 py-3 text-right tabular">{formatNumber(p.views_count)}</td>
                <td className="px-3 py-3 text-right tabular">{formatNumber(p.comments_count)}</td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="icon-sm" variant="ghost" aria-label="देखें"><Link to={`/blog/${p.status === "published" ? p.slug : p.id}`}><Eye /></Link></Button>
                    <Button asChild size="icon-sm" variant="ghost" aria-label="संपादित करें"><Link to={`/admin/posts/${p.id}`}><Pencil /></Link></Button>
                    <Button size="icon-sm" variant="ghost" aria-label="हटाएँ" onClick={() => setToDelete(p)} className="text-destructive"><Trash2 /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {total > PAGE && (
        <div className="flex items-center justify-between font-hindi text-small">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>पिछला</Button>
          <span className="tabular text-muted-foreground">पेज {page + 1} / {Math.ceil(total / PAGE)}</span>
          <Button variant="outline" size="sm" disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>अगला</Button>
        </div>
      )}

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">यह पोस्ट हटाएँ?</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi">“{toDelete?.title}” और उसके सवाल, व्यूज़ और सेव हमेशा के लिए हट जाएँगे।</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-hindi">रद्द करें</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} className="bg-destructive font-hindi text-destructive-foreground hover:bg-destructive/90">हटाएँ</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
