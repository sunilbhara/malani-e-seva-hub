import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layers, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Skeleton } from "@/components/common/Skeleton";
import { formatPrice } from "@/lib/catalogImage";
import { queryKeys } from "@/lib/queryClient";
import {
  adminListCollections,
  deleteCollection,
  saveCollection,
  setCollectionItems,
  type CatalogCollection,
  type CatalogItem,
} from "@/services/catalog";
import { cn } from "@/lib/utils";

interface Draft {
  id?: string;
  title: string;
  description: string;
  is_active: boolean;
  item_ids: string[];
}

const blank = (): Draft => ({ title: "", description: "", is_active: true, item_ids: [] });

/** Admin: curated product collections ("नए आए", "दिवाली ऑफ़र", …) shown as sections and filters on the products page. */
export function AdminCollections({ products }: { products: CatalogItem[] }) {
  const queryClient = useQueryClient();
  const collections = useQuery({ queryKey: queryKeys.adminCatalog("collections"), queryFn: adminListCollections });
  const [draft, setDraft] = useState<Draft | null>(null);
  const [toDelete, setToDelete] = useState<CatalogCollection | null>(null);
  const [busy, setBusy] = useState(false);
  const list = collections.data ?? [];
  const byId = new Map(products.map((p) => [p.id, p]));

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminCatalog("collections") });
    void queryClient.invalidateQueries({ queryKey: queryKeys.catalog("shop") });
  };

  async function onSave() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("कलेक्शन का नाम लिखें।");
      return;
    }
    if (draft.title.trim().length > 80) {
      toast.error("नाम 80 अक्षरों से छोटा रखें।");
      return;
    }
    setBusy(true);
    try {
      const maxOrder = list.reduce((m, c) => Math.max(m, c.sort_order), 0);
      const id = await saveCollection({ ...draft, sort_order: maxOrder + 10 });
      await setCollectionItems(id, draft.item_ids);
      toast.success(draft.id ? "कलेक्शन सेव हो गया" : "नया कलेक्शन बन गया");
      setDraft(null);
      refresh();
    } catch {
      toast.error("कलेक्शन सेव नहीं हो सका");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(c: CatalogCollection, isActive: boolean) {
    try {
      await saveCollection({ id: c.id, title: c.title, description: c.description ?? "", is_active: isActive });
      refresh();
    } catch {
      toast.error("बदलाव सेव नहीं हुआ");
    }
  }

  async function confirmDelete() {
    if (!toDelete) return;
    const c = toDelete;
    setToDelete(null);
    try {
      await deleteCollection(c.id);
      toast.success("कलेक्शन हटा दिया गया (प्रोडक्ट नहीं हटे)");
      refresh();
    } catch {
      toast.error("कलेक्शन हटाया नहीं जा सका");
    }
  }

  const toggleItem = (id: string) =>
    setDraft((d) => (d ? { ...d, item_ids: d.item_ids.includes(id) ? d.item_ids.filter((x) => x !== id) : [...d.item_ids, id] } : d));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="mr-auto max-w-xl font-hindi text-small text-muted-foreground">
          कलेक्शन प्रोडक्ट पेज पर अलग-अलग सेक्शन और फ़िल्टर बनकर दिखते हैं — जैसे “नए आए”, “दिवाली ऑफ़र”, “₹500 से कम”। एक प्रोडक्ट कई कलेक्शन में हो सकता है।
        </p>
        <Button type="button" onClick={() => setDraft(blank())} className="font-hindi">
          <Plus /> नया कलेक्शन
        </Button>
      </div>

      {collections.isLoading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      ) : collections.isError ? (
        <p className="font-hindi text-destructive">कलेक्शन लोड नहीं हो सके।</p>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-8 text-center">
          <Layers aria-hidden className="h-8 w-8 text-muted-foreground" />
          <p className="font-hindi text-muted-foreground">अभी कोई कलेक्शन नहीं है। “नया कलेक्शन” से बनाएँ।</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {list.map((c) => {
            const items = c.item_ids.map((id) => byId.get(id)).filter((p): p is CatalogItem => Boolean(p));
            return (
              <li key={c.id} className={cn("flex items-center gap-3 rounded-xl border bg-card p-3", !c.is_active && "opacity-60")}>
                <div className="flex shrink-0 -space-x-3">
                  {items.slice(0, 3).map((p) => (
                    <img key={p.id} src={p.image_url} alt="" className="h-11 w-11 rounded-lg border-2 border-card bg-white object-cover" />
                  ))}
                  {items.length === 0 && <span className="grid h-11 w-11 place-items-center rounded-lg border bg-muted"><Layers aria-hidden className="h-5 w-5 text-muted-foreground" /></span>}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-hindi font-semibold">{c.title}</p>
                  <p className="font-hindi text-caption font-normal text-muted-foreground">
                    {items.length} प्रोडक्ट{!c.is_active && " · छुपा हुआ"}
                  </p>
                </div>
                <Switch checked={c.is_active} onCheckedChange={(v) => void toggleActive(c, v)} aria-label={`${c.title} पेज पर दिखाएँ`} />
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${c.title} बदलें`} onClick={() => setDraft({ id: c.id, title: c.title, description: c.description ?? "", is_active: c.is_active, item_ids: [...c.item_ids] })}>
                  <Pencil />
                </Button>
                <Button type="button" variant="ghost" size="icon-sm" aria-label={`${c.title} हटाएँ`} onClick={() => setToDelete(c)}>
                  <Trash2 />
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && !busy && setDraft(null)}>
        <DialogContent className="max-h-[92vh] max-w-lg overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-hindi">{draft?.id ? "कलेक्शन बदलें" : "नया कलेक्शन"}</DialogTitle>
            <DialogDescription className="font-hindi">नाम रखें और इसमें दिखने वाले प्रोडक्ट चुनें।</DialogDescription>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="collection-title" className="font-hindi">कलेक्शन का नाम</Label>
                <Input id="collection-title" value={draft.title} maxLength={80} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="जैसे: दिवाली ऑफ़र" className="h-11 font-hindi" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="collection-description" className="font-hindi">छोटा विवरण (वैकल्पिक)</Label>
                <Input id="collection-description" value={draft.description} maxLength={300} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="जैसे: त्योहार पर खास दाम" className="h-11 font-hindi" />
              </div>
              <fieldset className="space-y-2">
                <legend className="font-hindi text-small font-medium">
                  प्रोडक्ट चुनें <span className="text-muted-foreground">({draft.item_ids.length} चुने गए)</span>
                </legend>
                {products.length === 0 ? (
                  <p className="font-hindi text-small text-muted-foreground">पहले “प्रोडक्ट” टैब में प्रोडक्ट जोड़ें।</p>
                ) : (
                  <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border p-1">
                    {products.map((p) => {
                      const checked = draft.item_ids.includes(p.id);
                      return (
                        <li key={p.id}>
                          <label className={cn("flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5", checked ? "bg-secondary" : "hover:bg-muted")}>
                            <input type="checkbox" className="h-4 w-4 shrink-0" checked={checked} onChange={() => toggleItem(p.id)} aria-label={p.title} />
                            <img src={p.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md border bg-white object-cover" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-small font-semibold">{p.title}</span>
                              <span className="block text-caption font-normal text-muted-foreground">
                                {formatPrice(p.price) ?? "दाम पूछें"}
                                {!p.is_active && " · छुपा हुआ"}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </fieldset>
              <label className="flex items-center gap-2 font-hindi text-small">
                <Switch checked={draft.is_active} onCheckedChange={(v) => setDraft({ ...draft, is_active: v })} /> पेज पर दिखाएँ
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" disabled={busy} onClick={() => setDraft(null)} className="font-hindi">रद्द करें</Button>
                <Button type="button" disabled={busy} onClick={() => void onSave()} className="font-hindi">{busy ? "सेव हो रहा है…" : "सेव करें"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hindi">यह कलेक्शन हटाएँ?</AlertDialogTitle>
            <AlertDialogDescription className="font-hindi">“{toDelete?.title}” हट जाएगा। इसके प्रोडक्ट नहीं हटेंगे।</AlertDialogDescription>
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
