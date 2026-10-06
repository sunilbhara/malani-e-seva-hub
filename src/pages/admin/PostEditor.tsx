import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { PageSpinner } from "@/components/common/PageSpinner";
import { useAuth } from "@/hooks/useAuth";
import { getPost, savePost, type JobDetailsInput, type PostInput, type PostStatus } from "@/services/posts";
import { createRecruitment, listRecruitments } from "@/services/tracker";
import { uploadBlogImage } from "@/services/media";
import { generateDraft } from "@/services/ai";
import { DEPARTMENTS, parseExtraDates, parseFees, POST_TYPES, QUALIFICATIONS, STATES } from "@/lib/jobs";
import { safeHttpUrl } from "@/lib/url";
import { stripHtml } from "@/lib/html";
import { validatePostForm, type PostFormState as FormState } from "@/lib/postForm";
import { cn } from "@/lib/utils";

const CATEGORIES = ["Government Job", "Admit Card", "Result", "Exam Date", "Application Form", "Barmer News", "E-Mitra Guide", "Community"];

const TEMPLATES: Record<string, string> = {
  job: "<h2>भर्ती का संक्षिप्त विवरण</h2><p></p><h2>पद विवरण</h2><p></p><h2>योग्यता</h2><ul><li></li></ul><h2>आयु सीमा</h2><p></p><h2>चयन प्रक्रिया</h2><ul><li></li></ul><h2>आवेदन कैसे करें</h2><ol><li>आधिकारिक वेबसाइट खोलें</li><li></li></ol><h2>ज़रूरी दस्तावेज़</h2><ul><li></li></ul>",
  admit_card: "<h2>एडमिट कार्ड जानकारी</h2><p></p><h2>एडमिट कार्ड कैसे डाउनलोड करें</h2><ol><li>आधिकारिक वेबसाइट खोलें</li><li>रजिस्ट्रेशन नंबर और जन्म तिथि डालें</li><li>एडमिट कार्ड डाउनलोड करें</li></ol><h2>परीक्षा के दिन ज़रूरी दस्तावेज़</h2><ul><li></li></ul>",
  result: "<h2>रिजल्ट अपडेट</h2><p></p><h2>रिजल्ट कैसे देखें</h2><ol><li></li></ol><h2>कट-ऑफ</h2><p></p><h2>अगला चरण</h2><p></p>",
  local_news: "<h2>मुख्य जानकारी</h2><p></p><h2>बाड़मेर के लोगों के लिए क्यों ज़रूरी है?</h2><p></p>",
};

const JOB_TYPES = new Set(["job", "admit_card", "result", "exam"]);


const EMPTY: FormState = {
  title: "",
  content: TEMPLATES.job,
  postType: "job",
  category: "Government Job",
  tags: "",
  imageUrl: "",
  seoTitle: "",
  seoDescription: "",
  sourceUrl: "",
  officialLink: "",
  isVerified: false,
  language: "hi",
  status: "published",
  scheduledAt: "",
  hasJob: true,
  recruitmentId: "",
  organisation: "",
  totalPosts: "",
  qualifications: [],
  departments: [],
  state: "rajasthan",
  ageMin: "",
  ageMax: "",
  salary: "",
  fees: [],
  applyStart: "",
  lastDate: "",
  feeLastDate: "",
  admitCardDate: "",
  examDate: "",
  resultDate: "",
  extraDates: [],
  applyLink: "",
  notificationPdf: "",
  officialWebsite: "",
};

function toLocalInput(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}


function toPayload(f: FormState): { post: PostInput; job: JobDetailsInput | null } {
  const post: PostInput = {
    title: f.title.trim(),
    content: f.content.trim(),
    image_url: safeHttpUrl(f.imageUrl),
    category: f.category || null,
    tags: Array.from(new Set(f.tags.split(",").map((t) => t.trim()).filter(Boolean))).slice(0, 12),
    status: f.status,
    scheduled_at: f.status === "scheduled" && f.scheduledAt ? new Date(f.scheduledAt).toISOString() : null,
    language: f.language,
    seo_title: f.seoTitle.trim() || null,
    seo_description: f.seoDescription.trim() || null,
    og_image_url: safeHttpUrl(f.imageUrl),
    canonical_url: null,
    source_url: safeHttpUrl(f.sourceUrl),
    official_link: safeHttpUrl(f.officialLink),
    is_verified: f.isVerified,
    post_type: f.postType,
  };
  const n = (v: string) => (v.trim() ? Number(v) : null);
  const d = (v: string) => v || null;
  const job: JobDetailsInput | null = f.hasJob
    ? {
        recruitment_id: f.recruitmentId || null,
        organisation: f.organisation.trim(),
        total_posts: n(f.totalPosts),
        qualifications: f.qualifications,
        departments: f.departments,
        state: f.state,
        age_min: n(f.ageMin),
        age_max: n(f.ageMax),
        salary: f.salary.trim() || null,
        fees: f.fees.filter((fee) => fee.category.trim()),
        apply_start: d(f.applyStart),
        last_date: d(f.lastDate),
        fee_last_date: d(f.feeLastDate),
        admit_card_date: d(f.admitCardDate),
        exam_date: d(f.examDate),
        result_date: d(f.resultDate),
        extra_dates: f.extraDates.filter((x) => x.label.trim() && x.date),
        apply_link: safeHttpUrl(f.applyLink),
        notification_pdf: safeHttpUrl(f.notificationPdf),
        official_website: safeHttpUrl(f.officialWebsite),
      }
    : null;
  return { post, job };
}

function Field({ label, htmlFor, children, hint, className }: { label: string; htmlFor?: string; children: React.ReactNode; hint?: string; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="font-hindi">{label}</Label>
      {children}
      {hint && <p className="font-hindi text-caption font-normal text-muted-foreground">{hint}</p>}
    </div>
  );
}

function MultiChips({ options, value, onChange }: { options: ReadonlyArray<{ value: string; label: string }>; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value])}
            className={cn("min-h-9 rounded-full border px-3 font-hindi text-small font-semibold", on ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export default function PostEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id || id === "new";
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loaded, setLoaded] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [newRecruitment, setNewRecruitment] = useState("");

  const existing = useQuery({ queryKey: ["admin", "post", id], queryFn: () => getPost(id!), enabled: !isNew });
  const recruitments = useQuery({ queryKey: ["admin", "recruitments"], queryFn: () => listRecruitments() });

  useEffect(() => {
    const p = existing.data;
    if (!p || loaded) return;
    const j = p.job;
    setForm({
      title: p.title,
      content: p.content || "<p></p>",
      postType: p.post_type ?? "article",
      category: p.category ?? "Government Job",
      tags: (p.tags ?? []).join(", "),
      imageUrl: p.image_url ?? "",
      seoTitle: p.seo_title ?? "",
      seoDescription: p.seo_description ?? "",
      sourceUrl: p.source_url ?? "",
      officialLink: p.official_link ?? "",
      isVerified: p.is_verified,
      language: p.language === "en" ? "en" : "hi",
      status: (p.status as PostStatus) ?? "draft",
      scheduledAt: toLocalInput(p.scheduled_at),
      hasJob: Boolean(j),
      recruitmentId: j?.recruitment_id ?? "",
      organisation: j?.organisation ?? "",
      totalPosts: j?.total_posts ? String(j.total_posts) : "",
      qualifications: j?.qualifications ?? [],
      departments: j?.departments ?? [],
      state: j?.state ?? "rajasthan",
      ageMin: j?.age_min ? String(j.age_min) : "",
      ageMax: j?.age_max ? String(j.age_max) : "",
      salary: j?.salary ?? "",
      fees: parseFees(j?.fees),
      applyStart: j?.apply_start ?? "",
      lastDate: j?.last_date ?? "",
      feeLastDate: j?.fee_last_date ?? "",
      admitCardDate: j?.admit_card_date ?? "",
      examDate: j?.exam_date ?? "",
      resultDate: j?.result_date ?? "",
      extraDates: parseExtraDates(j?.extra_dates),
      applyLink: j?.apply_link ?? "",
      notificationPdf: j?.notification_pdf ?? "",
      officialWebsite: j?.official_website ?? "",
    });
    setLoaded(true);
  }, [existing.data, loaded]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  function changeType(type: string) {
    setForm((f) => {
      const untouched = Object.values(TEMPLATES).includes(f.content) || !stripHtml(f.content);
      return {
        ...f,
        postType: type,
        hasJob: f.hasJob || JOB_TYPES.has(type),
        content: untouched ? TEMPLATES[type] ?? "<p></p>" : f.content,
        category: type === "admit_card" ? "Admit Card" : type === "result" ? "Result" : type === "exam" ? "Exam Date" : type === "local_news" ? "Barmer News" : type === "guide" ? "E-Mitra Guide" : f.category,
      };
    });
  }

  async function onUploadCover(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      set("imageUrl", await uploadBlogImage(file));
      toast.success("फोटो अपलोड हो गई");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "फोटो अपलोड नहीं हो सकी");
    } finally {
      setUploading(false);
    }
  }

  async function onGenerate() {
    setAiBusy(true);
    try {
      const draft = await generateDraft(aiInput);
      setForm((f) => {
        const j = draft.job;
        return {
          ...f,
          title: draft.title || f.title,
          seoDescription: draft.metaDescription || f.seoDescription,
          content: draft.content || f.content,
          postType: POST_TYPES.some((t) => t.value === draft.postType) ? draft.postType : f.postType,
          tags: draft.tags.length ? draft.tags.join(", ") : f.tags,
          hasJob: f.hasJob || Boolean(j),
          ...(j
            ? {
                organisation: j.organisation ?? f.organisation,
                totalPosts: j.totalPosts ? String(j.totalPosts) : f.totalPosts,
                qualifications: j.qualifications.length ? j.qualifications : f.qualifications,
                departments: j.departments.length ? j.departments : f.departments,
                state: j.state,
                ageMin: j.ageMin ? String(j.ageMin) : f.ageMin,
                ageMax: j.ageMax ? String(j.ageMax) : f.ageMax,
                salary: j.salary ?? f.salary,
                fees: j.fees.length ? j.fees : f.fees,
                applyStart: j.applyStart ?? f.applyStart,
                lastDate: j.lastDate ?? f.lastDate,
                feeLastDate: j.feeLastDate ?? f.feeLastDate,
                admitCardDate: j.admitCardDate ?? f.admitCardDate,
                examDate: j.examDate ?? f.examDate,
                resultDate: j.resultDate ?? f.resultDate,
                applyLink: j.applyLink ?? f.applyLink,
                notificationPdf: j.notificationPdf ?? f.notificationPdf,
                officialWebsite: j.officialWebsite ?? f.officialWebsite,
              }
            : {}),
        };
      });
      setAiOpen(false);
      setAiInput("");
      toast.success("AI ड्राफ़्ट भर दिया गया — प्रकाशित करने से पहले हर तारीख और लिंक जाँचें");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI ड्राफ़्ट नहीं बन सका");
    } finally {
      setAiBusy(false);
    }
  }

  async function onAddRecruitment() {
    if (newRecruitment.trim().length < 3) return;
    try {
      const r = await createRecruitment(newRecruitment, form.organisation || newRecruitment);
      set("recruitmentId", r.id);
      setNewRecruitment("");
      void queryClient.invalidateQueries({ queryKey: ["admin", "recruitments"] });
      toast.success("भर्ती सीरीज़ बन गई");
    } catch {
      toast.error("यह नाम पहले से है या बन नहीं सका");
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const problems = validatePostForm(form);
    setErrors(problems);
    if (problems.length) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!user) return;
    setSaving(true);
    try {
      const { post, job } = toPayload(form);
      const saved = await savePost({ id: isNew ? undefined : id, authorId: user.id, post, job });
      await queryClient.invalidateQueries({ queryKey: ["admin"] });
      await queryClient.invalidateQueries({ queryKey: ["post"] });
      await queryClient.invalidateQueries({ queryKey: ["listing"] });
      await queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success(form.status === "published" ? "पोस्ट प्रकाशित हो गई" : form.status === "scheduled" ? "पोस्ट शेड्यूल हो गई" : "ड्राफ़्ट सेव हो गया");
      navigate(isNew ? `/admin/posts/${saved.id}` : "/admin/posts", { replace: isNew });
      if (isNew) setLoaded(false);
    } catch (error) {
      const message = (error as { message?: string })?.message ?? "";
      toast.error(message.includes("check constraint") ? "कोई फ़ील्ड सही फ़ॉर्मेट में नहीं है (लिंक/तारीख जाँचें)।" : "सेव नहीं हो सका। दोबारा कोशिश करें।");
    } finally {
      setSaving(false);
    }
  }

  const statusOptions: Array<{ value: PostStatus; label: string }> = useMemo(
    () => [
      { value: "published", label: "अभी प्रकाशित करें" },
      { value: "scheduled", label: "शेड्यूल करें" },
      { value: "draft", label: "ड्राफ़्ट" },
      { value: "archived", label: "आर्काइव" },
    ],
    [],
  );

  if (!isNew && (existing.isLoading || !loaded)) return <PageSpinner />;
  if (!isNew && !existing.data) return <p className="font-hindi">पोस्ट नहीं मिली।</p>;

  return (
    <form onSubmit={(e) => void onSubmit(e)} className="space-y-6" noValidate>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-hindi text-2xl font-bold">{isNew ? "नई पोस्ट" : "पोस्ट संपादित करें"}</h1>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setAiOpen(true)} className="font-hindi"><Sparkles /> AI से ड्राफ़्ट</Button>
          {!isNew && <Button asChild variant="ghost" className="font-hindi"><Link to={`/blog/${id}`} target="_blank">पूर्वावलोकन</Link></Button>}
        </div>
      </div>

      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-status-urgent-bg p-4">
          <p className="font-hindi font-semibold text-status-urgent">सेव करने से पहले ठीक करें:</p>
          <ul className="mt-1 list-disc pl-5 font-hindi text-small text-status-urgent">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}

      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <Field label="पोस्ट का प्रकार">
          <div className="flex flex-wrap gap-1.5">
            {POST_TYPES.map((t) => (
              <button key={t.value} type="button" aria-pressed={form.postType === t.value} onClick={() => changeType(t.value)}
                className={cn("min-h-10 rounded-full border px-3.5 font-hindi text-small font-semibold", form.postType === t.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted")}>
                {t.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="शीर्षक" htmlFor="title" hint="सूत्र: [संस्था] [पद] भर्ती [वर्ष] — [N] पद, अंतिम तिथि [तारीख] (65 अक्षर तक सबसे अच्छा)">
          <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={180} className="h-12 font-hindi text-body" />
          <p className={cn("text-right text-caption font-normal tabular", form.title.length > 65 ? "text-status-soon" : "text-muted-foreground")}>{form.title.length}/65</p>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="कैटेगरी" htmlFor="category">
            <select id="category" value={form.category} onChange={(e) => set("category", e.target.value)} className="h-11 w-full rounded-xl border bg-card px-3 font-hindi">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="टैग (कॉमा से अलग)" htmlFor="tags">
            <Input id="tags" value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="पुलिस, राजस्थान, 12वीं पास" className="h-11 font-hindi" />
          </Field>
        </div>
      </section>

      {/* Job details (structured data powers cards, filters, reminders and Google for Jobs) */}
      <section className="space-y-4 rounded-2xl border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-hindi text-lg font-bold">भर्ती की जानकारी</h2>
            <p className="font-hindi text-caption font-normal text-muted-foreground">कार्ड, फ़िल्टर, रिमाइंडर और Google for Jobs इसी से बनते हैं।</p>
          </div>
          <label className="flex items-center gap-2 font-hindi text-small">
            <Switch checked={form.hasJob} onCheckedChange={(v) => set("hasJob", v)} /> चालू
          </label>
        </div>
        {form.hasJob && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="विभाग / संस्था *" htmlFor="org"><Input id="org" value={form.organisation} onChange={(e) => set("organisation", e.target.value)} className="h-11 font-hindi" placeholder="RSMSSB" /></Field>
              <Field label="कुल पद" htmlFor="posts"><Input id="posts" inputMode="numeric" value={form.totalPosts} onChange={(e) => set("totalPosts", e.target.value.replace(/[^0-9]/g, ""))} className="h-11" /></Field>
            </div>
            <Field label="भर्ती सीरीज़ (नोटिफ़िकेशन → एडमिट कार्ड → रिजल्ट को जोड़ती है)">
              <div className="flex flex-col gap-2 sm:flex-row">
                <select value={form.recruitmentId} onChange={(e) => set("recruitmentId", e.target.value)} className="h-11 flex-1 rounded-xl border bg-card px-3 font-hindi">
                  <option value="">— कोई नहीं —</option>
                  {recruitments.data?.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                <div className="flex flex-1 gap-2">
                  <Input value={newRecruitment} onChange={(e) => setNewRecruitment(e.target.value)} placeholder="नई सीरीज़, जैसे RSMSSB पटवारी 2026" className="h-11 font-hindi" />
                  <Button type="button" variant="outline" onClick={() => void onAddRecruitment()} aria-label="सीरीज़ जोड़ें"><Plus /></Button>
                </div>
              </div>
            </Field>
            <Field label="योग्यता"><MultiChips options={QUALIFICATIONS} value={form.qualifications} onChange={(v) => set("qualifications", v)} /></Field>
            <Field label="विभाग श्रेणी"><MultiChips options={DEPARTMENTS} value={form.departments} onChange={(v) => set("departments", v)} /></Field>
            <div className="grid gap-4 sm:grid-cols-4">
              <Field label="क्षेत्र" htmlFor="state" className="sm:col-span-2">
                <select id="state" value={form.state} onChange={(e) => set("state", e.target.value)} className="h-11 w-full rounded-xl border bg-card px-3 font-hindi">
                  {STATES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="न्यूनतम आयु" htmlFor="agemin"><Input id="agemin" inputMode="numeric" value={form.ageMin} onChange={(e) => set("ageMin", e.target.value.replace(/[^0-9]/g, ""))} className="h-11" /></Field>
              <Field label="अधिकतम आयु" htmlFor="agemax"><Input id="agemax" inputMode="numeric" value={form.ageMax} onChange={(e) => set("ageMax", e.target.value.replace(/[^0-9]/g, ""))} className="h-11" /></Field>
            </div>
            <Field label="वेतन" htmlFor="salary"><Input id="salary" value={form.salary} onChange={(e) => set("salary", e.target.value)} placeholder="पे-लेवल 5 (₹20,800–65,900)" className="h-11 font-hindi" /></Field>

            <div className="grid gap-4 sm:grid-cols-3">
              {([
                ["applyStart", "आवेदन शुरू"],
                ["lastDate", "अंतिम तिथि"],
                ["feeLastDate", "शुल्क की अंतिम तिथि"],
                ["admitCardDate", "एडमिट कार्ड"],
                ["examDate", "परीक्षा तिथि"],
                ["resultDate", "रिजल्ट"],
              ] as const).map(([key, label]) => (
                <Field key={key} label={label} htmlFor={key}><Input id={key} type="date" value={form[key]} onChange={(e) => set(key, e.target.value)} className="h-11" /></Field>
              ))}
            </div>

            <Field label="अन्य तिथियाँ">
              <div className="space-y-2">
                {form.extraDates.map((row, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={row.label} onChange={(e) => set("extraDates", form.extraDates.map((r, j) => (j === i ? { ...r, label: e.target.value } : r)))} placeholder="जैसे: आंसर की" className="h-11 font-hindi" />
                    <Input type="date" value={row.date} onChange={(e) => set("extraDates", form.extraDates.map((r, j) => (j === i ? { ...r, date: e.target.value } : r)))} className="h-11 w-44" />
                    <Button type="button" variant="ghost" size="icon" aria-label="हटाएँ" onClick={() => set("extraDates", form.extraDates.filter((_, j) => j !== i))}><Trash2 /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="font-hindi" onClick={() => set("extraDates", [...form.extraDates, { label: "", date: "" }])}><Plus /> तिथि जोड़ें</Button>
              </div>
            </Field>

            <Field label="आवेदन शुल्क">
              <div className="space-y-2">
                {form.fees.map((fee, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={fee.category} onChange={(e) => set("fees", form.fees.map((r, j) => (j === i ? { ...r, category: e.target.value } : r)))} placeholder="सामान्य / OBC" className="h-11 font-hindi" />
                    <Input inputMode="numeric" value={String(fee.amount)} onChange={(e) => set("fees", form.fees.map((r, j) => (j === i ? { ...r, amount: Number(e.target.value.replace(/[^0-9]/g, "")) || 0 } : r)))} className="h-11 w-32" aria-label="राशि ₹" />
                    <Button type="button" variant="ghost" size="icon" aria-label="हटाएँ" onClick={() => set("fees", form.fees.filter((_, j) => j !== i))}><Trash2 /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="font-hindi" onClick={() => set("fees", [...form.fees, { category: "", amount: 0 }])}><Plus /> शुल्क जोड़ें</Button>
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="ऑनलाइन आवेदन लिंक" htmlFor="apply"><Input id="apply" type="url" value={form.applyLink} onChange={(e) => set("applyLink", e.target.value)} placeholder="https://" className="h-11" /></Field>
              <Field label="अधिसूचना PDF" htmlFor="pdf"><Input id="pdf" type="url" value={form.notificationPdf} onChange={(e) => set("notificationPdf", e.target.value)} placeholder="https://" className="h-11" /></Field>
              <Field label="आधिकारिक वेबसाइट" htmlFor="site"><Input id="site" type="url" value={form.officialWebsite} onChange={(e) => set("officialWebsite", e.target.value)} placeholder="https://" className="h-11" /></Field>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <Label className="font-hindi text-lg font-bold">विवरण</Label>
        <RichTextEditor value={form.content} onChange={(html) => set("content", html)} onUploadImage={uploadBlogImage} />
      </section>

      <section className="grid gap-4 rounded-2xl border bg-card p-5 md:grid-cols-2">
        <Field label="कवर फोटो (1200×630 सबसे अच्छा)">
          <div className="flex items-center gap-3">
            {form.imageUrl && <img src={form.imageUrl} alt="" className="h-16 w-28 rounded-lg border object-cover" />}
            <label className={cn("inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border bg-card px-4 font-hindi text-small font-semibold hover:bg-muted", uploading && "opacity-60")}>
              <ImagePlus className="h-4 w-4" /> {uploading ? "अपलोड…" : form.imageUrl ? "बदलें" : "अपलोड करें"}
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(e) => void onUploadCover(e.target.files?.[0])} />
            </label>
            {form.imageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => set("imageUrl", "")} className="font-hindi">हटाएँ</Button>}
          </div>
        </Field>
        <Field label="SEO शीर्षक (वैकल्पिक)" htmlFor="seo-title"><Input id="seo-title" value={form.seoTitle} onChange={(e) => set("seoTitle", e.target.value)} maxLength={70} className="h-11 font-hindi" /></Field>
        <Field label="SEO विवरण" htmlFor="seo-desc" hint={`${form.seoDescription.length}/160`} className="md:col-span-2">
          <Textarea id="seo-desc" value={form.seoDescription} onChange={(e) => set("seoDescription", e.target.value)} maxLength={170} className="font-hindi" />
        </Field>
        <Field label="स्रोत लिंक" htmlFor="source"><Input id="source" type="url" value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} className="h-11" placeholder="https://" /></Field>
        <Field label="आधिकारिक लिंक" htmlFor="official"><Input id="official" type="url" value={form.officialLink} onChange={(e) => set("officialLink", e.target.value)} className="h-11" placeholder="https://" /></Field>
        <label className="flex items-center gap-3 font-hindi text-small md:col-span-2">
          <Switch checked={form.isVerified} onCheckedChange={(v) => set("isVerified", v)} />
          “आधिकारिक स्रोत से सत्यापित” बैज दिखाएँ — केवल आधिकारिक अधिसूचना जाँचने के बाद
        </label>
      </section>

      <section className="sticky bottom-0 z-20 -mx-4 flex flex-col gap-3 border-t bg-card/95 px-4 py-3 backdrop-blur sm:flex-row sm:items-center lg:static lg:mx-0 lg:rounded-2xl lg:border">
        <div className="flex flex-wrap gap-1.5">
          {statusOptions.map((o) => (
            <button key={o.value} type="button" aria-pressed={form.status === o.value} onClick={() => set("status", o.value)}
              className={cn("min-h-10 rounded-lg border px-3 font-hindi text-small font-semibold", form.status === o.value ? "border-primary bg-primary text-primary-foreground" : "bg-card")}>
              {o.label}
            </button>
          ))}
        </div>
        {form.status === "scheduled" && (
          <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => set("scheduledAt", e.target.value)} className="h-11 sm:w-56" aria-label="शेड्यूल का समय" />
        )}
        <Button type="submit" size="lg" disabled={saving} className="font-hindi sm:ml-auto">
          {saving ? "सेव हो रहा है…" : form.status === "published" ? "प्रकाशित करें" : form.status === "scheduled" ? "शेड्यूल करें" : "सेव करें"}
        </Button>
      </section>

      <Sheet open={aiOpen} onOpenChange={setAiOpen}>
        <SheetContent side="bottom" className="mx-auto max-w-2xl">
          <SheetHeader className="text-left">
            <SheetTitle className="font-hindi">AI से ड्राफ़्ट बनाएँ</SheetTitle>
            <SheetDescription className="font-hindi">अधिसूचना का टेक्स्ट पेस्ट करें। AI शीर्षक, विवरण और भर्ती की सभी जानकारी भर देगा — प्रकाशित करने से पहले जाँच लें।</SheetDescription>
          </SheetHeader>
          <Textarea value={aiInput} onChange={(e) => setAiInput(e.target.value)} maxLength={20000} className="mt-4 min-h-[220px] font-hindi" placeholder="भर्ती की पूरी जानकारी यहाँ पेस्ट करें…" />
          <p className="mt-1 text-right text-caption font-normal text-muted-foreground tabular">{aiInput.length}/20000</p>
          <Button type="button" size="lg" className="mt-3 w-full font-hindi" disabled={aiBusy || !aiInput.trim()} onClick={() => void onGenerate()}>
            <Sparkles /> {aiBusy ? "बन रहा है… (30 सेकंड तक)" : "ड्राफ़्ट बनाएँ"}
          </Button>
        </SheetContent>
      </Sheet>
    </form>
  );
}
