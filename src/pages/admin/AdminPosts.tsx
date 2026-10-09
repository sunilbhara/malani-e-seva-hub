import { Skeleton } from "@/components/common/Skeleton";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Share2, Trash2 } from "lucide-react";
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
import { shareText, whatsappShareUrl } from "@/lib/share";
import { cn } from "@/lib/utils";

const STATUS: Record<PostStatus, { label: string; className: string }> = {
  published: { label: "प्रकाशित", className: "bg-status-open-bg text-status-open" },
  draft: { label: "ड्राफ़्ट", className: "bg-muted text-muted-foreground" },
  scheduled: { label: "शेड्यूल", className: "bg-secondary text-secondary-foreground" },
  archived: { label: "आर्काइव", className: "bg-status-closed-bg text-status-closed" },
};
const PAGE = 25;

function PostActions({ p, onDelete }: { p: AdminPostRow; onDelete: () => void }) {
  return (
    <>
      <Button asChild size="icon-sm" variant="ghost" aria-label="देखें"><Link to={`/blog/${p.status === "published" ? p.slug : p.id}`}><Eye /></Link></Button>
      <Button asChild size="icon-sm" variant="ghost" aria-label="संपादित करें"><Link to={`/admin/posts/${p.id}`}><Pencil /></Link></Button>
      {p.status === "published" && (
        <Button asChild size="icon-sm" variant="ghost" aria-label="WhatsApp पर शेयर करें">
          <a href={whatsappShareUrl(shareText({ title: p.title, slug: p.slug }))} target="_blank" rel="noopener noreferrer"><Share2 /></a>
        </Button>
      )}
      <Button size="icon-sm" variant="ghost" aria-label="हटाएँ" onClick={onDelete} className="text-destructive"><Trash2 /></Button>
    </>
  );
}

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
        <table className="w-full text-small md:min-w-[720px]">
          <thead>
            <tr className="border-b text-left font-hindi text-muted-foreground">
              <th className="px-4 py-3 font-medium">शीर्षक</th>
              <th className="px-3 py-3 font-medium">स्थिति</th>
              <th className="hidden px-3 py-3 font-medium md:table-cell">अपडेट</th>
              <th className="hidden px-3 py-3 text-right font-medium md:table-cell">व्यू</th>
              <th className="hidden px-3 py-3 text-right font-medium md:table-cell">सवाल</th>
              <th className="hidden px-3 py-3 md:table-cell"><span className="sr-only">कार्य</span></th>
            </tr>
          </thead>
          <tbody>
            {posts.isLoading && (
              Array.from({ length: 5 }, (_, i) => (
                <tr key={i} aria-hidden>
                  <td colSpan={6} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                </tr>
              ))
            )}
            {posts.data?.items.map((p) => (
              <tr key={p.id} className="border-b last:border-0">
                <td className="max-w-[22rem] px-4 py-3">
                  <p className="truncate font-hindi font-medium">{p.title}</p>
                  <p className="font-hindi text-caption font-normal text-muted-foreground">
                    {postTypeShort(p.post_type)}
                    {p.read_time_min ? ` · ${p.read_time_min} मिनट पढ़ाई` : ""}
                  </p>
                  {/* Phones: the facts and actions that the hidden columns show on desktop. */}
                  <p className="mt-1 font-hindi text-caption font-normal text-muted-foreground md:hidden">
                    <span className="tabular">{formatDateTime(p.updated_at)}</span> · <span className="tabular">{formatNumber(p.views_count)}</span> व्यू · <span className="tabular">{formatNumber(p.comments_count)}</span> सवाल
                  </p>
                  <div className="mt-1.5 flex gap-1 md:hidden">
                    <PostActions p={p} onDelete={() => setToDelete(p)} />
                  </div>
                </td>
                <td className="px-3 py-3"><span className={cn("rounded-full px-2.5 py-1 font-hindi text-caption", STATUS[p.status]?.className)}>{STATUS[p.status]?.label ?? p.status}</span>
                  {p.status === "scheduled" && p.scheduled_at && <p className="mt-1 text-caption font-normal text-muted-foreground">{formatDateTime(p.scheduled_at)}</p>}
                </td>
                <td className="hidden whitespace-nowrap px-3 py-3 text-caption font-normal text-muted-foreground md:table-cell">{formatDateTime(p.updated_at)}</td>
                <td className="hidden px-3 py-3 text-right tabular md:table-cell">{formatNumber(p.views_count)}</td>
                <td className="hidden px-3 py-3 text-right tabular md:table-cell">{formatNumber(p.comments_count)}</td>
                <td className="hidden px-3 py-3 md:table-cell">
                  <div className="flex justify-end gap-1">
                    <PostActions p={p} onDelete={() => setToDelete(p)} />
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
