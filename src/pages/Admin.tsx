import { useCallback, useEffect, useMemo, useState, FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  BarChart3,
  CalendarClock,
  ExternalLink,
  ImagePlus,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createPost,
  deletePost,
  getAdminAnalytics,
  getAdminPosts,
  updatePost,
  type BlogAnalytics,
  type PostInput,
  type PostWithAuthor,
} from "@/services/posts";
import { createNotificationsForNewPost } from "@/services/blogExtras";
import { generateHindiBlogWithGemini } from "@/services/gemini";
import { uploadBlogImageToCloudinary } from "@/services/media";
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
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SEO } from "@/components/seo/SEO";

type PostStatus = NonNullable<PostInput["status"]>;
type PostType = NonNullable<PostInput["post_type"]>;

const CATEGORIES = [
  "Government Job",
  "Admit Card",
  "Result",
  "Exam Date",
  "Application Form",
  "Barmer News",
  "E-Mitra Guide",
  "Community",
];

const POST_TYPES: Array<{ value: PostType; label: string }> = [
  { value: "article", label: "Article" },
  { value: "job", label: "Government Job" },
  { value: "admit_card", label: "Admit Card" },
  { value: "result", label: "Result" },
  { value: "exam", label: "Exam" },
  { value: "local_news", label: "Local News" },
  { value: "guide", label: "Guide" },
];

const CONTENT_TEMPLATES: Record<string, string> = {
  job: `<h2>✅ भर्ती का नाम</h2><p></p><h2>✅ महत्वपूर्ण तारीखें</h2><ul><li>आवेदन शुरू:</li><li>अंतिम तिथि:</li><li>परीक्षा तिथि:</li></ul><h2>✅ योग्यता और आयु सीमा</h2><p></p><h2>✅ आवेदन प्रक्रिया</h2><p></p><h2>📍 फॉर्म भरवाने में मदद चाहिए?</h2><p>अगर आपको ऑनलाइन फॉर्म भरने में परेशानी हो रही है तो मालाणी मोबाइल ई-मित्र सर्विस, बाड़मेर पर संपर्क करें।</p>`,
  admit_card: `<h2>✅ एडमिट कार्ड जानकारी</h2><p></p><h2>✅ डाउनलोड कैसे करें</h2><ul><li>ऑफिशियल वेबसाइट खोलें</li><li>रजिस्ट्रेशन नंबर डालें</li><li>एडमिट कार्ड डाउनलोड करें</li></ul><h2>✅ जरूरी दस्तावेज</h2><p></p>`,
  result: `<h2>✅ रिजल्ट अपडेट</h2><p></p><h2>✅ रिजल्ट कैसे देखें</h2><p></p><h2>✅ अगला चरण</h2><p></p>`,
  local_news: `<h2>📢 मुख्य जानकारी</h2><p></p><h2>📍 बाड़मेर के लोगों के लिए क्यों जरूरी है?</h2><p></p><h2>✅ निष्कर्ष</h2><p></p>`,
};

const emptyForm = {
  title: "",
  content: "<p></p>",
  imageUrl: "",
  category: "Government Job",
  tags: "",
  status: "published" as PostStatus,
  scheduledAt: "",
  language: "hi" as "hi" | "en",
  seoTitle: "",
  seoDescription: "",
  ogImageUrl: "",
  canonicalUrl: "",
  sourceUrl: "",
  officialLink: "",
  isVerified: false,
  postType: "article" as PostType,
};

const Admin = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<PostWithAuthor[]>([]);
  const [analytics, setAnalytics] = useState<BlogAnalytics | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<PostWithAuthor | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const [geminiInput, setGeminiInput] = useState("");
  const [geminiLoading, setGeminiLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const refresh = useCallback(async () => {
    setListLoading(true);
    try {
      const [postData, analyticsData] = await Promise.all([getAdminPosts(), getAdminAnalytics()]);
      setPosts(postData);
      setAnalytics(analyticsData);
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

  const setField = <K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSheetOpen(true);
  };

  const openEdit = (record: PostWithAuthor) => {
    setEditingId(record.id);
    setForm({
      title: record.title,
      content: record.content?.trim() ? record.content : "<p></p>",
      imageUrl: record.image_url ?? "",
      category: record.category ?? "Government Job",
      tags: (record.tags ?? []).join(", "),
      status: record.status ?? "published",
      scheduledAt: record.scheduled_at ? dayjs(record.scheduled_at).format("YYYY-MM-DDTHH:mm") : "",
      language: record.language ?? "hi",
      seoTitle: record.seo_title ?? "",
      seoDescription: record.seo_description ?? "",
      ogImageUrl: record.og_image_url ?? "",
      canonicalUrl: record.canonical_url ?? "",
      sourceUrl: record.source_url ?? "",
      officialLink: record.official_link ?? "",
      isVerified: Boolean(record.is_verified),
      postType: record.post_type ?? "article",
    });
    setSheetOpen(true);
  };

  const closeSheet = () => {
    setSheetOpen(false);
    setEditingId(null);
  };

  const payload = useMemo<PostInput>(() => {
    const tags = form.tags.split(",").map((tag) => tag.trim()).filter(Boolean);
    const status = form.scheduledAt && form.status === "published" ? "scheduled" : form.status;
    return {
      title: form.title.trim(),
      content: form.content.trim(),
      image_url: form.imageUrl.trim() || null,
      category: form.category.trim() || "general",
      tags,
      status,
      scheduled_at: form.scheduledAt ? new Date(form.scheduledAt).toISOString() : null,
      published_at: status === "published" ? new Date().toISOString() : null,
      language: form.language,
      seo_title: form.seoTitle.trim() || null,
      seo_description: form.seoDescription.trim() || null,
      og_image_url: form.ogImageUrl.trim() || form.imageUrl.trim() || null,
      canonical_url: form.canonicalUrl.trim() || null,
      source_url: form.sourceUrl.trim() || null,
      official_link: form.officialLink.trim() || null,
      is_verified: form.isVerified,
      post_type: form.postType,
    };
  }, [form]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!payload.title) {
      toast.error("Please add a title.");
      return;
    }
    if (!stripHtml(payload.content).trim()) {
      toast.error("Please write some content.");
      return;
    }
    setSubmitting(true);
    try {
      const wasPublished = editingId ? posts.find((post) => post.id === editingId)?.status === "published" : false;
      const saved = editingId ? await updatePost(editingId, payload) : await createPost(payload, user.id);
      if (payload.status === "published" && !wasPublished) {
        await createNotificationsForNewPost(saved.id, payload.title, payload.seo_description || "New blog update is available.");
      }
      toast.success(payload.status === "draft" ? "Draft saved." : payload.status === "scheduled" ? "Post scheduled." : "Post published.");
      closeSheet();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function onUploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadBlogImageToCloudinary(file);
      setField("imageUrl", url);
      if (!form.ogImageUrl) setField("ogImageUrl", url);
      toast.success("Image uploaded and optimized.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Image upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  }

  async function onGeminiGenerate() {
    if (!geminiInput.trim()) {
      toast.info("Paste raw job/exam details first.");
      return;
    }
    setGeminiLoading(true);
    try {
      const result = await generateHindiBlogWithGemini(geminiInput);
      if (result?.content) {
        setField("content", result.content.replace(/\n{2,}/g, "\n\n"));
        if (!form.title && result.title) setField("title", result.title.slice(0, 180));
        if (result.metaDescription) setField("seoDescription", result.metaDescription.slice(0, 170));
        setGeminiOpen(false);
        setGeminiInput("");
        toast.success("Gemini draft added to editor.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Gemini generation failed";
      toast.error(msg);
    } finally {
      setGeminiLoading(false);
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      await deletePost(deleteTarget.id);
      toast.success("Post removed.");
      setDeleteTarget(null);
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      toast.error(msg);
    }
  }

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
        <p className="font-hindi text-lg font-medium text-gray-800">You do not have admin access.</p>
        <Button asChild variant="outline" className="rounded-full font-hindi">
          <Link to="/blog">Go to Blog</Link>
        </Button>
      </div>
    );
  }

  const statCards = [
    ["Total Posts", analytics?.totals.posts ?? 0],
    ["Published", analytics?.totals.published ?? 0],
    ["Drafts", analytics?.totals.drafts ?? 0],
    ["Views", analytics?.totals.views ?? 0],
    ["Likes", analytics?.totals.likes ?? 0],
    ["Subscribers", analytics?.totals.subscribers ?? 0],
  ];

  return (
    <DashboardLayout>
      <SEO title="Admin - Malani Barmer" description="Admin dashboard" path="/admin" noindex />
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="font-hindi text-3xl font-bold tracking-tight text-gray-900">Blog Management</h1>
            <p className="mt-1 font-hindi text-gray-600">Create, schedule, optimize, and track public blog posts.</p>
          </div>
          <Button type="button" className={cn("font-hindi", brandCtaClass)} onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {statCards.map(([label, value]) => (
            <Card key={label} className="border-amber-100/90 bg-white/90 shadow-md backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardTitle className="font-hindi text-sm font-medium text-gray-600">{label}</CardTitle>
              </CardHeader>
              <CardContent>
                {listLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold tabular-nums text-gray-900">{value}</p>}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <Card className="overflow-hidden border-amber-100/90 bg-white/95 shadow-lg">
            <CardHeader className="border-b border-amber-100/80 bg-amber-50/40">
              <CardTitle className="flex items-center gap-2 font-hindi text-xl text-gray-900">
                <BarChart3 className="h-5 w-5 text-amber-700" />
                All Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {listLoading ? (
                <div className="space-y-3 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
              ) : posts.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="mb-4 font-hindi text-gray-600">No posts yet.</p>
                  <Button onClick={openCreate} className={cn("font-hindi", brandCtaClass)}>Write the first post</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-[88px] font-hindi">Cover</TableHead>
                      <TableHead className="font-hindi">Title</TableHead>
                      <TableHead className="hidden font-hindi md:table-cell">Status</TableHead>
                      <TableHead className="hidden font-hindi lg:table-cell">Category</TableHead>
                      <TableHead className="hidden font-hindi sm:table-cell">Date</TableHead>
                      <TableHead className="text-right font-hindi">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {posts.map((row) => (
                      <TableRow key={row.id}>
                        <TableCell>
                          {row.image_url ? (
                            <img src={row.image_url} alt="" className="h-11 w-16 rounded-lg object-cover ring-1 ring-amber-100" />
                          ) : (
                            <div className="flex h-11 w-16 items-center justify-center rounded-lg bg-amber-50 text-[10px] text-amber-700/60">-</div>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[220px] font-hindi font-medium text-gray-900 sm:max-w-xs">
                          <Link to={`/blog/${row.slug ?? row.id}`} target="_blank" rel="noreferrer" className="hover:text-amber-800 hover:underline">
                            {row.title}
                          </Link>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {(row.tags ?? []).slice(0, 3).map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                            {row.is_verified && <Badge className="bg-emerald-600 text-[10px]">Verified</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={row.status === "published" ? "default" : "secondary"} className="capitalize">{row.status}</Badge>
                        </TableCell>
                        <TableCell className="hidden font-hindi text-gray-600 lg:table-cell">{row.category ?? "-"}</TableCell>
                        <TableCell className="hidden font-hindi text-gray-600 sm:table-cell">
                          {dayjs(row.published_at ?? row.created_at).format("D MMM, YYYY")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button type="button" variant="ghost" size="icon" asChild title="Preview">
                              <a href={`/blog/${row.slug ?? row.id}`} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                            </Button>
                            <Button type="button" variant="ghost" size="icon" title="Edit" onClick={() => openEdit(row)}><Pencil className="h-4 w-4" /></Button>
                            <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" title="Delete" onClick={() => setDeleteTarget(row)}>
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

          <div className="space-y-4">
            <Card className="border-amber-100/90 bg-white/95 shadow-md">
              <CardHeader>
                <CardTitle className="font-hindi text-lg">Trending Posts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analytics?.trending ?? []).map((post) => (
                  <div key={post.id} className="rounded-xl border border-amber-100 p-3">
                    <p className="line-clamp-2 font-hindi text-sm font-semibold text-gray-900">{post.title}</p>
                    <p className="mt-1 text-xs text-gray-500">{post.views_count} views · {post.likes_count} likes · {post.comments_count} comments</p>
                  </div>
                ))}
                {!analytics?.trending?.length && <p className="font-hindi text-sm text-gray-500">No analytics yet.</p>}
              </CardContent>
            </Card>
            <Card className="border-amber-100/90 bg-white/95 shadow-md">
              <CardHeader>
                <CardTitle className="font-hindi text-lg">Most-read Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {(analytics?.categories ?? []).slice(0, 6).map((cat) => (
                  <div key={cat.category} className="flex items-center justify-between rounded-xl bg-amber-50/60 px-3 py-2">
                    <span className="font-hindi text-sm font-medium">{cat.category}</span>
                    <span className="text-xs text-gray-600">{cat.views} views</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Sheet open={sheetOpen} onOpenChange={(open) => !open && closeSheet()}>
        <SheetContent side="right" className="flex w-full flex-col overflow-y-auto sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle className="font-hindi text-xl">{editingId ? "Edit Post" : "New Post"}</SheetTitle>
            <SheetDescription className="font-hindi text-gray-600">Add content, tags, publishing settings, SEO, and verification details.</SheetDescription>
          </SheetHeader>
          <form onSubmit={onSubmit} className="mt-6 flex flex-1 flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="admin-title" className="font-hindi">Title</Label>
                <Input id="admin-title" value={form.title} onChange={(e) => setField("title", e.target.value)} required maxLength={200} className="rounded-xl border-amber-200 font-hindi" />
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Category</Label>
                <Input list="blog-categories" value={form.category} onChange={(e) => setField("category", e.target.value)} className="rounded-xl border-amber-200 font-hindi" />
                <datalist id="blog-categories">{CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Tags</Label>
                <Input value={form.tags} onChange={(e) => setField("tags", e.target.value)} placeholder="Admit Card, Rajasthan Jobs, Barmer News" className="rounded-xl border-amber-200 font-hindi" />
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Post Type</Label>
                <select value={form.postType} onChange={(e) => setField("postType", e.target.value as PostType)} className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 font-hindi text-sm">
                  {POST_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Language</Label>
                <select value={form.language} onChange={(e) => setField("language", e.target.value as "hi" | "en")} className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 font-hindi text-sm">
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Status</Label>
                <select value={form.status} onChange={(e) => setField("status", e.target.value as PostStatus)} className="h-10 w-full rounded-xl border border-amber-200 bg-white px-3 font-hindi text-sm">
                  <option value="published">Publish now</option>
                  <option value="draft">Save draft</option>
                  <option value="scheduled">Schedule</option>
                  <option value="archived">Archive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Schedule Time</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setField("scheduledAt", e.target.value)} className="rounded-xl border-amber-200" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-hindi">Cover Image</Label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input value={form.imageUrl} onChange={(e) => setField("imageUrl", e.target.value)} placeholder="https://..." className="rounded-xl" />
                <Button type="button" variant="outline" className="relative rounded-xl font-hindi" disabled={uploading}>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload"}
                  <input type="file" accept="image/*" onChange={(e) => void onUploadImage(e.target.files?.[0])} className="absolute inset-0 cursor-pointer opacity-0" />
                </Button>
              </div>
              {form.imageUrl.trim() && <img src={form.imageUrl.trim()} alt="" className="max-h-48 w-full rounded-xl object-cover ring-1 ring-amber-100" />}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="rounded-full font-hindi" onClick={() => setGeminiOpen(true)}>
                <Sparkles className="mr-2 h-4 w-4" />
                Gemini Hindi Writer
              </Button>
              {Object.entries(CONTENT_TEMPLATES).map(([key, template]) => (
                <Button key={key} type="button" variant="secondary" size="sm" className="rounded-full font-hindi" onClick={() => setField("content", template)}>
                  {key.replace("_", " ")} template
                </Button>
              ))}
            </div>

            <div className="flex min-h-0 flex-1 flex-col space-y-2">
              <Label className="font-hindi">Content</Label>
              <Tabs defaultValue="write" className="flex min-h-0 flex-1 flex-col">
                <TabsList className="grid w-full grid-cols-2 rounded-xl bg-amber-50/80 p-1">
                  <TabsTrigger value="write" className="rounded-lg font-hindi">Editor</TabsTrigger>
                  <TabsTrigger value="preview" className="rounded-lg font-hindi">Preview</TabsTrigger>
                </TabsList>
                <TabsContent value="write" className="mt-3 min-h-[280px] flex-1 data-[state=inactive]:hidden">
                  <RichTextEditor key={editingId ?? "create"} value={form.content} onChange={(value) => setField("content", value)} placeholder="यहां अपना लेख लिखें..." />
                </TabsContent>
                <TabsContent value="preview" className="mt-3 min-h-[200px] flex-1 data-[state=inactive]:hidden">
                  <div className="max-h-[480px] min-h-[240px] overflow-auto rounded-xl border border-amber-100 bg-white p-5 shadow-inner">
                    <HindiTypography as="h3" className="!mt-0 text-xl font-bold text-gray-900">{form.title.trim() || "-"}</HindiTypography>
                    <div className="mt-4 border-t border-amber-50 pt-4"><PostBody content={form.content || "<p></p>"} /></div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <div className="grid gap-4 rounded-2xl border border-amber-100 bg-amber-50/40 p-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-hindi">SEO Title</Label>
                <Input value={form.seoTitle} onChange={(e) => setField("seoTitle", e.target.value)} maxLength={70} className="rounded-xl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="font-hindi">Meta Description</Label>
                <Textarea value={form.seoDescription} onChange={(e) => setField("seoDescription", e.target.value)} maxLength={170} className="min-h-20 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Open Graph Image</Label>
                <Input value={form.ogImageUrl} onChange={(e) => setField("ogImageUrl", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Canonical URL</Label>
                <Input value={form.canonicalUrl} onChange={(e) => setField("canonicalUrl", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Source URL</Label>
                <Input value={form.sourceUrl} onChange={(e) => setField("sourceUrl", e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="font-hindi">Official Link</Label>
                <Input value={form.officialLink} onChange={(e) => setField("officialLink", e.target.value)} className="rounded-xl" />
              </div>
              <label className="flex items-center gap-2 font-hindi text-sm text-gray-700">
                <input type="checkbox" checked={form.isVerified} onChange={(e) => setField("isVerified", e.target.checked)} />
                Verified / official source checked
              </label>
            </div>

            <SheetFooter className="mt-auto flex-row gap-2 border-t border-amber-100 pt-4 sm:justify-end">
              <Button type="button" variant="outline" className="rounded-full font-hindi" onClick={closeSheet}>Cancel</Button>
              <Button type="submit" disabled={submitting} className={cn("rounded-full font-hindi", brandCtaClass)}>
                {submitting ? "Saving..." : form.status === "draft" ? "Save Draft" : form.scheduledAt ? "Schedule" : "Publish"}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <AlertDialog open={geminiOpen} onOpenChange={setGeminiOpen}>
        <AlertDialogContent className="max-w-2xl rounded-2xl border-amber-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">Gemini Hindi Blog Writer</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi text-gray-600">Paste raw recruitment, admit card, result, or exam details. Gemini will create a Hindi SEO draft using your default local E-Mitra prompt.</AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea value={geminiInput} onChange={(e) => setGeminiInput(e.target.value)} className="min-h-64 rounded-xl font-hindi" placeholder="Paste raw details here..." />
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-hindi">Cancel</AlertDialogCancel>
            <AlertDialogAction className={cn("rounded-full font-hindi", brandCtaClass)} disabled={geminiLoading} onClick={(e) => { e.preventDefault(); void onGeminiGenerate(); }}>
              <Sparkles className="mr-2 h-4 w-4" />
              {geminiLoading ? "Generating..." : "Generate Draft"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl border-amber-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi text-gray-600">This will permanently remove the post. Comments, likes, bookmarks, and analytics may also be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-full font-hindi">Cancel</AlertDialogCancel>
            <AlertDialogAction className="rounded-full bg-gradient-to-r from-red-600 to-rose-700 font-hindi text-white hover:opacity-95" onClick={() => void confirmDelete()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Admin;
