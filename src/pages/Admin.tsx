import { useCallback, useEffect, useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createPost, deletePost, getPosts, updatePost, type PostWithAuthor } from "@/services/posts";
import { supabase } from "@/lib/supabase";
import { stripHtml } from "@/lib/blogUtils";
import { brandCtaClass } from "@/lib/blogBrand";
import { DashboardLayout } from "@/components/admin/DashboardLayout";
import { RichTextEditor } from "@/components/blog/RichTextEditor";
import { PostBody } from "@/components/blog/PostBody";
import { HindiTypography } from "@/components/blog/HindiTypography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
const adminCopy = {
  noAccess: "You do not have admin access.",
  goBlog: "Go to Blog",
  adminTitle: "Blog Management",
  adminSubtitle: "Create, edit, and publish posts for the public blog.",
  newPost: "New Post",
  statPosts: "Total Posts",
  statComments: "Comments",
  statLikes: "Likes",
  allPosts: "All Posts",
  noPostsAdmin: "No posts yet.",
  writeFirst: "Write the first post",
  sheetCreateTitle: "New Post",
  sheetEditTitle: "Edit Post",
  sheetCreateDesc: "Publish a new post.",
  sheetEditDesc: "Update title, cover, and content.",
  fieldTitle: "Title",
  fieldCoverUrl: "Cover Image URL",
  fieldContent: "Content",
  tabEditor: "Editor",
  tabPreview: "Preview",
  cancel: "Cancel",
  save: "Save",
  publish: "Publish",
  saving: "Saving...",
  deleteConfirmTitle: "Delete this post?",
  deleteConfirmDesc: "This will permanently remove the post. Comments and likes may also be affected.",
  deleteConfirm: "Delete",
  preview: "Preview",
  edit: "Edit",
  delete: "Delete",
  toastPostSaved: "Post saved.",
  toastPostPublished: "Post published.",
  toastPostRemoved: "Post removed.",
};


type PostRow = PostWithAuthor;

const Admin = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({ posts: 0, comments: 0, likes: 0 });
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PostRow | null>(null);

  const refresh = useCallback(async () => {
    setListLoading(true);
    try {
      const data = await getPosts();
      setPosts(data);
      const [pRes, cRes, lRes] = await Promise.all([
        supabase.from("posts").select("id", { count: "exact", head: true }),
        supabase.from("comments").select("id", { count: "exact", head: true }),
        supabase.from("post_likes").select("id", { count: "exact", head: true }),
      ]);
      setStats({
        posts: pRes.count ?? data.length,
        comments: cRes.count ?? 0,
        likes: lRes.count ?? 0,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      toast.error(msg);
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role === "admin") void refresh();
  }, [role, refresh]);

  const openCreate = () => {
    setEditingId(null);
    setTitle("");
    setContent("<p></p>");
    setImageUrl("");
    setSheetOpen(true);
  };

  const openEdit = (record: PostRow) => {
    setEditingId(record.id);
    setTitle(record.title);
    setContent(record.content?.trim() ? record.content : "<p></p>");
    setImageUrl(record.image_url ?? "");
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingId(null);
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!stripHtml(content).trim()) {
      toast.error("Please write some content.");
      return;
    }
    setSubmitting(true);
    try {
      const image_url = imageUrl.trim() || null;
      if (editingId) {
        await updatePost(editingId, { title: title.trim(), content: content.trim(), image_url });
        toast.success(adminCopy.toastPostSaved);
      } else {
        await createPost({ title: title.trim(), content: content.trim(), image_url }, user.id);
        toast.success(adminCopy.toastPostPublished);
      }
      closeSheet();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id);
      toast.success(adminCopy.toastPostRemoved);
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

  const statLabels = { posts: adminCopy.statPosts, comments: adminCopy.statComments, likes: adminCopy.statLikes };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 via-white to-green-50 px-4 text-center">
        <p className="font-hindi text-lg font-medium text-gray-800">{adminCopy.noAccess}</p>
        <Button asChild variant="outline" className="rounded-full font-hindi">
          <Link to="/blog">{adminCopy.goBlog}</Link>
        </Button>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-hindi text-3xl font-bold tracking-tight text-gray-900">{adminCopy.adminTitle}</h1>
            <p className="mt-1 font-hindi text-gray-600">{adminCopy.adminSubtitle}</p>
          </div>
          <Button type="button" className={cn("font-hindi", brandCtaClass)} onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {adminCopy.newPost}
          </Button>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {(["posts", "comments", "likes"] as const).map((key) => (
            <Card key={key} className="border-amber-100/90 bg-white/90 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-hindi text-sm font-medium text-gray-600">{statLabels[key]}</CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? (
                  <Skeleton className="h-9 w-16" />
                ) : (
                  <p className="text-3xl font-bold tabular-nums text-gray-900">{stats[key]}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden border-amber-100/90 bg-white/95 shadow-lg">
          <CardHeader className="border-b border-amber-100/80 bg-amber-50/40">
            <CardTitle className="font-hindi text-xl text-gray-900">{adminCopy.allPosts}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {listLoading ? (
              <div className="space-y-3 p-6">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="mb-4 font-hindi text-gray-600">{adminCopy.noPostsAdmin}</p>
                <Button onClick={openCreate} className={cn("font-hindi", brandCtaClass)}>
                  {adminCopy.writeFirst}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[88px] font-hindi">{adminCopy.cover}</TableHead>
                    <TableHead className="font-hindi">{adminCopy.titleCol}</TableHead>
                    <TableHead className="hidden font-hindi md:table-cell">{adminCopy.authorCol}</TableHead>
                    <TableHead className="hidden font-hindi sm:table-cell">{adminCopy.publishedCol}</TableHead>
                    <TableHead className="text-right font-hindi">{adminCopy.actionsCol}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posts.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {row.image_url ? (
                          <img src={row.image_url} alt="" className="h-11 w-16 rounded-lg object-cover ring-1 ring-amber-100" />
                        ) : (
                          <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-amber-50 text-[10px] text-amber-700/60">
                            —
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] font-hindi font-medium text-gray-900 sm:max-w-xs">
                        <Link to={`/blog/${row.slug ?? row.id}`} target="_blank" rel="noreferrer" className="hover:text-amber-800 hover:underline">
                          {row.title}
                        </Link>
                      </TableCell>
                      <TableCell className="hidden font-hindi text-gray-600 md:table-cell">{row.author?.full_name ?? "—"}</TableCell>
                      <TableCell className="hidden font-hindi text-gray-600 sm:table-cell">
                        {dayjs(row.created_at).format("D MMM, YYYY")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button type="button" variant="ghost" size="icon" asChild title={adminCopy.preview}>
                            <a href={`/blog/${row.slug ?? row.id}`} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button type="button" variant="ghost" size="icon" title={adminCopy.edit} onClick={() => openEdit(row)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            title={adminCopy.delete}
                            onClick={() => setDeleteTarget(row)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(o) => !o && closeSheet()}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle className="font-hindi text-xl">{editingId ? adminCopy.sheetEditTitle : adminCopy.sheetCreateTitle}</SheetTitle>
            <SheetDescription className="font-hindi text-gray-600">{editingId ? adminCopy.sheetEditDesc : adminCopy.sheetCreateDesc}</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="admin-title" className="font-hindi">
                {adminCopy.fieldTitle}
              </Label>
              <Input
                id="admin-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="…"
                required
                maxLength={200}
                className="rounded-xl border-amber-200 font-hindi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-image" className="font-hindi">
                {adminCopy.fieldCoverUrl}
              </Label>
              <Input
                id="admin-image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://…"
                className="rounded-xl"
              />
            </div>
            {imageUrl.trim() && (
              <div className="overflow-hidden rounded-xl border border-amber-100 ring-1 ring-black/5">
                <img src={imageUrl.trim()} alt="" className="max-h-48 w-full object-cover" />
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <Label className="font-hindi">{adminCopy.fieldContent}</Label>
              <Tabs defaultValue="write" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-amber-50/80 p-1">
                  <TabsTrigger value="write" className="rounded-lg font-hindi">
                    {adminCopy.tabEditor}
                  </TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-lg font-hindi">
                    {adminCopy.tabPreview}
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="write" className="mt-3 min-h-[280px] flex-1 data-[state=inactive]:hidden">
                  <RichTextEditor
                    key={editingId ?? "create"}
                    value={content}
                    onChange={setContent}
                    placeholder="यहाँ अपना लेख लिखें… शीर्षक, सूची, लिंक व छवि जोड़ सकते हैं।"
                  />
                </TabsContent>
                <TabsContent value="preview" className="mt-3 min-h-[200px] flex-1 data-[state=inactive]:hidden">
                  <div className="max-h-[480px] min-h-[240px] overflow-auto rounded-xl border border-amber-100 bg-white p-5 shadow-inner">
                    <HindiTypography as="h3" className="!mt-0 text-xl font-bold text-gray-900">
                      {title.trim() || "—"}
                    </HindiTypography>
                    <div className="mt-4 border-t border-amber-50 pt-4">
                      <PostBody content={content || "<p></p>"} />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
            <SheetFooter className="mt-auto flex-row gap-2 border-t border-amber-100 pt-4 sm:justify-end">
              <Button type="button" variant="outline" className="rounded-full font-hindi" onClick={closeSheet}>
                {adminCopy.cancel}
              </Button>
              <Button type="submit" disabled={submitting} className={cn("rounded-full font-hindi", brandCtaClass)}>
                {submitting ? adminCopy.saving : editingId ? adminCopy.save : adminCopy.publish}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-amber-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">{adminCopy.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi text-gray-600">{adminCopy.deleteConfirmDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-hindi">{adminCopy.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-full bg-gradient-to-r from-red-600 to-rose-700 font-hindi text-white hover:opacity-95"
              onClick={() => void confirmDelete()}
            >
              {adminCopy.deleteConfirm}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Admin;
