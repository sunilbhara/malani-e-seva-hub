// Shop catalog (mobile & electronics products, Mataji Studio photos), managed at /admin/catalog.
// Readers get active items only (RLS); writes and uploads are admin-only in the database and storage.
import { supabase } from "@/lib/supabase";
import type { CatalogKind } from "@/lib/catalogImage";

export const CATALOG_BUCKET = "catalog";

export interface CatalogItem {
  id: string;
  kind: CatalogKind;
  category: string;
  title: string;
  price: number | null;
  features: string[];
  image_url: string;
  image_path: string | null;
  sort_order: number;
  is_active: boolean;
}

export type CatalogDraft = Omit<CatalogItem, "id" | "sort_order"> & { id?: string; sort_order?: number };

const COLUMNS = "id, kind, category, title, price, features, image_url, image_path, sort_order, is_active";

async function list(kind: CatalogKind, activeOnly: boolean): Promise<CatalogItem[]> {
  let query = supabase.from("catalog_items").select(COLUMNS).eq("kind", kind);
  if (activeOnly) query = query.eq("is_active", true);
  const { data, error } = await query.order("sort_order").order("created_at");
  if (error) throw error;
  return (data ?? []) as CatalogItem[];
}

export const listCatalog = (kind: CatalogKind) => list(kind, true);
export const adminListCatalog = (kind: CatalogKind) => list(kind, false);

/** Uploads an already-normalised image; returns its public URL and storage path. */
export async function uploadCatalogImage(kind: CatalogKind, blob: Blob): Promise<{ url: string; path: string }> {
  const ext = blob.type === "image/jpeg" ? "jpg" : "webp";
  const path = `${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(CATALOG_BUCKET).upload(path, blob, {
    contentType: blob.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw new Error(error.message.includes("exceeded") ? "फोटो 512 KB से बड़ी है।" : "फोटो अपलोड नहीं हो सकी।");
  const { data } = supabase.storage.from(CATALOG_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

export async function removeCatalogImage(path: string | null): Promise<void> {
  if (!path) return;
  await supabase.storage.from(CATALOG_BUCKET).remove([path]);
}

function clean(draft: CatalogDraft) {
  const isProduct = draft.kind === "product";
  return {
    kind: draft.kind,
    category: draft.category,
    title: draft.title.trim(),
    price: isProduct ? draft.price : null,
    features: isProduct ? draft.features.map((f) => f.trim()).filter(Boolean).slice(0, 6) : [],
    image_url: draft.image_url,
    image_path: draft.image_path,
    is_active: draft.is_active,
  };
}

export async function saveCatalogItem(draft: CatalogDraft): Promise<void> {
  if (draft.id) {
    const { error } = await supabase.from("catalog_items").update(clean(draft)).eq("id", draft.id);
    if (error) throw error;
    return;
  }
  const { error } = await supabase.from("catalog_items").insert({ ...clean(draft), sort_order: draft.sort_order ?? 0 });
  if (error) throw error;
}

export async function setCatalogActive(id: string, isActive: boolean): Promise<void> {
  const { error } = await supabase.from("catalog_items").update({ is_active: isActive }).eq("id", id);
  if (error) throw error;
}

/** Swaps the display position of two items. */
export async function swapCatalogOrder(a: CatalogItem, b: CatalogItem): Promise<void> {
  const aOrder = a.sort_order === b.sort_order ? b.sort_order + 1 : b.sort_order;
  const results = await Promise.all([
    supabase.from("catalog_items").update({ sort_order: aOrder }).eq("id", a.id),
    supabase.from("catalog_items").update({ sort_order: a.sort_order }).eq("id", b.id),
  ]);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw failed.error;
}

export async function deleteCatalogItem(item: CatalogItem): Promise<void> {
  const { error } = await supabase.from("catalog_items").delete().eq("id", item.id);
  if (error) throw error;
  await removeCatalogImage(item.image_path).catch(() => undefined);
}
