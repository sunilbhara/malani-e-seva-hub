import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImagePlus, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { IMAGE_SPECS, discountPercent, formatPrice, prepareCatalogImage, type CatalogKind, type FitMode } from "@/lib/catalogImage";
import { catalogFormProblems, parseFeatures, parsePrice } from "@/lib/catalogForm";
import { queryKeys } from "@/lib/queryClient";
import { AdminCollections } from "@/pages/admin/AdminCollections";
import { ListSkeleton } from "@/components/common/PageSpinner";
import {
  adminListCatalog,
  adminListCollections,
  setItemCollections,
  deleteCatalogItem,
  removeCatalogImage,
  saveCatalogItem,
  setCatalogActive,
  swapCatalogOrder,
  uploadCatalogImage,
  type CatalogItem,
} from "@/services/catalog";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type View = CatalogKind | "collections";
const VIEWS: Array<{ kind: View; label: string }> = [
  { kind: "product", label: "प्रोडक्ट" },
  { kind: "collections", label: "कलेक्शन" },
  { kind: "studio_photo", label: "स्टूडियो फोटो" },
];

interface EditorState {
  item: CatalogItem | null;
  title: string;
  category: string;
  priceText: string;
  mrpText: string;
  featuresText: string;
  collectionIds: string[];
  isActive: boolean;
  file: File | null;
  blob: Blob | null;
  preview: string | null;
  fit: FitMode;
}

function editorFor(item: CatalogItem | null, defaultCategory: string, collectionIds: string[] = []): EditorState {
  return {
    item,
    title: item?.title ?? "",
    category: item?.category ?? defaultCategory,
    priceText: item?.price != null ? String(item.price) : "",
    mrpText: item?.mrp != null ? String(item.mrp) : "",
    featuresText: item?.features.join("\n") ?? "",
    collectionIds,
    isActive: item?.is_active ?? true,
    file: null,
    blob: null,
    preview: item?.image_url ?? null,
    fit: "crop",
  };
}

/** Admin editor for the shop pages: products (/mobile-electronics) and studio photos (/mataji-studio). */
export default function AdminCatalog() {
  const { messages } = useI18n();
  const queryClient = useQueryClient();
  const [view, setView] = useState<View>("product");
  const kind: CatalogKind = view === "collections" ? "product" : view;
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [toDelete, setToDelete] = useState<CatalogItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);

  const categories = (kind === "product" ? messages.homepage.mobileElectronics.categories : messages.homepage.matajiStudio.categories).filter(
    (c) => c.id !== "all",
  );
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const spec = IMAGE_SPECS[kind];

  const items = useQuery({ queryKey: queryKeys.adminCatalog(kind), queryFn: () => adminListCatalog(kind) });
  const list = items.data ?? [];
  const collections = useQuery({ queryKey: queryKeys.adminCatalog("collections"), queryFn: adminListCollections, enabled: kind === "product" });
  const collectionsOf = (id: string) => (collections.data ?? []).filter((c) => c.item_ids.includes(id)).map((c) => c.id);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog(kind) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog("collections") });
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog(kind) });
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog("shop") });
  };

  // Free object URLs created for previews.
  useEffect(() => {
    const url = editor?.preview;
    return () => {
      if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
    };
  }, [editor?.preview]);

  async function processFile(file: File, fit: FitMode) {
    setPreparing(true);
    try {
      const blob = await prepareCatalogImage(file, kind, fit);
      setEditor((e) => (e ? { ...e, file, blob, fit, preview: URL.createObjectURL(blob) } : e));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "फोटो तैयार नहीं हो सकी");
    } finally {
      setPreparing(false);
    }
  }

  async function onSave() {
    if (!editor) return;
    const problems = catalogFormProblems({
      kind,
      category: editor.category,
      title: editor.title,
      priceText: editor.priceText,
      mrpText: editor.mrpText,
      featuresText: editor.featuresText,
      isActive: editor.isActive,
      hasImage: Boolean(editor.blob || editor.item?.image_url),
    });
    if (problems.length) {
      toast.error(problems[0]);
      return;
    }
    setBusy(true);
    let uploaded: { url: string; path: string } | null = null;
    try {
      if (editor.blob) uploaded = await uploadCatalogImage(kind, editor.blob);
      const maxOrder = list.reduce((m, i) => Math.max(m, i.sort_order), 0);
      const price = kind === "product" ? (parsePrice(editor.priceText) ?? null) : null;
      const savedId = await saveCatalogItem({
        id: editor.item?.id,
        kind,
        category: editor.category,
        title: editor.title,
        price,
        mrp: kind === "product" ? (parsePrice(editor.mrpText) ?? null) : null,
        features: kind === "product" ? parseFeatures(editor.featuresText) : [],
        image_url: uploaded?.url ?? editor.item!.image_url,
        image_path: uploaded?.path ?? editor.item?.image_path ?? null,
        is_active: editor.isActive,
        sort_order: editor.item ? undefined : maxOrder + 10,
      });
      if (uploaded && editor.item?.image_path) await removeCatalogImage(editor.item.image_path).catch(() => undefined);
      if (kind === "product") {
        const before = editor.item ? collectionsOf(editor.item.id) : [];
        const changed = before.length !== editor.collectionIds.length || before.some((id) => !editor.collectionIds.includes(id));
        if (changed) await setItemCollections(savedId, editor.collectionIds);
      }
      toast.success(editor.item ? "बदलाव सेव हो गए" : "नया आइटम जुड़ गया");
      setEditor(null);
      refresh();
    } catch (err) {
      if (uploaded) await removeCatalogImage(uploaded.path).catch(() => undefined);
      toast.error(err instanceof Error && err.message ? err.message : "सेव नहीं हो सका");
    } finally {
      setBusy(false);
    }
  }

  async function run(action: () => Promise<void>, failure: string): Promise<boolean> {
    try {
      await action();
      refresh();
      return true;
    } catch {
      toast.error(failure);
      return false;
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const item = toDelete;
    setToDelete(null);
    if (await run(() => deleteCatalogItem(item), "हटाया नहीं जा सका")) toast.success("आइटम हटा दिया गया");
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="mr-auto font-hindi text-2xl font-bold">दुकान के आइटम</h1>
        {view !== "collections" && (
          <Button type="button" onClick={() => setEditor(editorFor(null, categories[0]?.id ?? ""))} className="font-hindi">
            <Plus /> {view === "product" ? "नया प्रोडक्ट" : "नई फोटो"}
          </Button>
        )}
      </div>

      <div role="tablist" aria-label="आइटम का प्रकार" className="inline-flex rounded-xl border bg-card p-1">
        {VIEWS.map((k) => (
          <button
            key={k.kind}
            type="button"
            role="tab"
            aria-selected={view === k.kind}
            onClick={() => setView(k.kind)}
            className={cn("min-h-11 rounded-lg px-3.5 py-2 font-hindi text-small font-semibold", view === k.kind ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {k.label}
          </button>
        ))}
      </div>
      {view === "collections" ? (
        <AdminCollections products={list} />
      ) : (
      <>
      <p className="font-hindi text-small text-muted-foreground">
        ये आइटम {kind === "product" ? "“मोबाइल और इलेक्ट्रॉनिक्स”" : "“माताजी स्टूडियो”"} पेज पर इसी क्रम में दिखते हैं। छुपाए गए आइटम पाठकों को नहीं दिखते।
      </p>

      {items.isLoading ? (
        <ListSkeleton rows={4} />
      ) : items.isError ? (
        <p className="font-hindi text-destructive">आइटम लोड नहीं हो सके।</p>
      ) : list.length === 0 ? (
        <p className="rounded-2xl border bg-card p-6 text-center font-hindi text-muted-foreground">अभी कोई आइटम नहीं है। “नया आइटम” से जोड़ें।</p>
      ) : (
        <ul className="space-y-2">
          {list.map((item, i) => (
            <li key={item.id} className={cn("flex items-center gap-3 rounded-2xl border bg-card p-2.5", !item.is_active && "opacity-60")}>
              <img src={item.image_url} alt="" className={cn("w-14 shrink-0 rounded-lg border bg-muted object-cover", kind === "product" ? "aspect-square" : "aspect-[3/4]")} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{item.title}</p>
                <p className="font-hindi text-caption text-muted-foreground">
                  {categoryName(item.category)}
                  {kind === "product" && ` · ${formatPrice(item.price) ?? "दाम पूछें"}`}
                  {kind === "product" && discountPercent(item.price, item.mrp) && ` (${discountPercent(item.price, item.mrp)}% छूट)`}
                  {!item.is_active && " · छुपा हुआ"}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <Switch
                  checked={item.is_active}
                  onCheckedChange={(v) => void run(() => setCatalogActive(item.id, v), "बदलाव सेव नहीं हुआ")}
                  aria-label={`${item.title} पेज पर दिखाएँ`}
                  className="mr-1"
                />
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === 0} aria-label="ऊपर करें" onClick={() => void run(() => swapCatalogOrder(item, list[i - 1]), "क्रम नहीं बदला")}>
                  <ArrowUp />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" disabled={i === list.length - 1} aria-label="नीचे करें" onClick={() => void run(() => swapCatalogOrder(item, list[i + 1]), "क्रम नहीं बदला")}>
                  <ArrowDown />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.title} बदलें`} onClick={() => setEditor(editorFor(item, categories[0]?.id ?? "", collectionsOf(item.id)))}>
                  <Pencil />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${item.title} हटाएँ`} onClick={() => setToDelete(item)}>
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      </>
      )}

      <Dialog open={Boolean(editor)} onOpenChange={(open) => !open && !busy && setEditor(null)}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-hindi">{editor?.item ? "आइटम बदलें" : kind === "product" ? "नया प्रोडक्ट" : "नई स्टूडियो फोटो"}</DialogTitle>
            <DialogDescription className="font-hindi">
              फोटो अपने-आप {spec.label} में बदल दी जाएगी, ताकि पेज पर हर कार्ड एक जैसा दिखे।
            </DialogDescription>
          </DialogHeader>
          {editor && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className={cn("w-28 shrink-0 overflow-hidden rounded-xl border bg-muted", kind === "product" ? "aspect-square" : "aspect-[3/4]")}>
                  {editor.preview && <img src={editor.preview} alt="फोटो का प्रीव्यू" className="h-full w-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <label className={cn("inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl border bg-card px-4 font-hindi text-small font-semibold hover:bg-muted", (preparing || busy) && "pointer-events-none opacity-60")}>
                    <ImagePlus aria-hidden className="h-4 w-4" /> {preparing ? "तैयार हो रही है…" : editor.preview ? "फोटो बदलें" : "फोटो चुनें"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      hidden
                      aria-label="फोटो चुनें"
                      disabled={preparing || busy}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void processFile(file, editor.fit);
                      }}
                    />
                  </label>
                  <p className="font-hindi text-caption text-muted-foreground">
                    JPG, PNG या WebP, 15 MB तक। कम से कम {spec.minSide} px; सबसे अच्छा {spec.label}।
                  </p>
                  <fieldset className="flex flex-wrap gap-3 font-hindi text-small">
                    <legend className="sr-only">फोटो कैसे फिट हो</legend>
                    {(
                      [
                        ["crop", "फ्रेम भरें (किनारे कटेंगे)"],
                        ["fit", "पूरी फोटो (सफ़ेद किनारे)"],
                      ] as const
                    ).map(([value, text]) => (
                      <label key={value} className="flex items-center gap-1.5">
                        <input
                          type="radio"
                          name="fit"
                          className="h-4 w-4"
                          checked={editor.fit === value}
                          disabled={preparing || busy}
                          onChange={() => (editor.file ? void processFile(editor.file, value) : setEditor({ ...editor, fit: value }))}
                        />
                        {text}
                      </label>
                    ))}
                  </fieldset>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="catalog-title" className="font-hindi">{kind === "product" ? "प्रोडक्ट का नाम" : "फोटो का शीर्षक"}</Label>
                <Input id="catalog-title" value={editor.title} maxLength={120} onChange={(e) => setEditor({ ...editor, title: e.target.value })} className="h-11 font-hindi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="catalog-category" className="font-hindi">श्रेणी</Label>
                <select id="catalog-category" value={editor.category} onChange={(e) => setEditor({ ...editor, category: e.target.value })} className="h-11 w-full rounded-xl border bg-card px-3 font-hindi">
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {kind === "product" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="catalog-price" className="font-hindi">बिक्री का दाम (₹)</Label>
                      <Input id="catalog-price" inputMode="numeric" value={editor.priceText} onChange={(e) => setEditor({ ...editor, priceText: e.target.value })} placeholder="79999" className="h-11 tabular" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="catalog-mrp" className="font-hindi">MRP (₹) — वैकल्पिक</Label>
                      <Input id="catalog-mrp" inputMode="numeric" value={editor.mrpText} onChange={(e) => setEditor({ ...editor, mrpText: e.target.value })} placeholder="89999" className="h-11 tabular" />
                    </div>
                  </div>
                  <p className="-mt-2 font-hindi text-caption font-normal text-muted-foreground">
                    {(() => {
                      const off = discountPercent(parsePrice(editor.priceText) ?? null, parsePrice(editor.mrpText) ?? null);
                      return off ? `पेज पर दिखेगा: MRP कटी हुई और “${off}% छूट”।` : "दाम खाली छोड़ें तो “दाम के लिए पूछें” दिखेगा। MRP ज़्यादा हो तो छूट दिखेगी।";
                    })()}
                  </p>
                  {(collections.data?.length ?? 0) > 0 && (
                    <fieldset className="space-y-2">
                      <legend className="font-hindi text-small font-medium">कलेक्शन में जोड़ें</legend>
                      <div className="flex flex-wrap gap-2">
                        {collections.data!.map((c) => {
                          const checked = editor.collectionIds.includes(c.id);
                          return (
                            <label key={c.id} className={cn("flex min-h-11 cursor-pointer items-center gap-2 rounded-full border px-3 font-hindi text-small", checked ? "border-primary bg-secondary" : "bg-card")}>
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={checked}
                                onChange={() =>
                                  setEditor({ ...editor, collectionIds: checked ? editor.collectionIds.filter((id) => id !== c.id) : [...editor.collectionIds, c.id] })
                                }
                              />
                              {c.title}
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="catalog-features" className="font-hindi">खूबियाँ — हर लाइन में एक (ज़्यादा से ज़्यादा 6)</Label>
                    <Textarea id="catalog-features" rows={3} value={editor.featuresText} onChange={(e) => setEditor({ ...editor, featuresText: e.target.value })} placeholder={"5000mAh Battery\n120Hz Display"} />
                  </div>
                </>
              )}
              <label className="flex items-center gap-2 font-hindi text-small">
                <Switch checked={editor.isActive} onCheckedChange={(v) => setEditor({ ...editor, isActive: v })} /> पेज पर दिखाएँ
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" disabled={busy} onClick={() => setEditor(null)} className="font-hindi">रद्द करें</Button>
                <Button type="button" disabled={busy || preparing} onClick={() => void onSave()} className="font-hindi">
                  {busy ? "सेव हो रहा है…" : "सेव करें"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">यह आइटम हटाएँ?</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi">“{toDelete?.title}” और उसकी फोटो हमेशा के लिए हट जाएगी। सिर्फ़ छुपाना हो तो स्विच बंद करें।</AlertDialogDescription>
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
