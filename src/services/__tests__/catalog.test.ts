import { beforeEach, describe, expect, it, vi } from "vitest";
import { opArgs, sb } from "@/test/supabaseMock";
import type { CatalogItem } from "@/services/catalog";

vi.mock("@/lib/supabase", async () => ({ supabase: (await import("@/test/supabaseMock")).sb.supabase }));

const catalog = await import("@/services/catalog");

const item = (patch: Partial<CatalogItem> = {}): CatalogItem => ({
  id: "i1",
  kind: "product",
  category: "mobiles",
  title: "Phone",
  price: 1000,
  features: [],
  image_url: "https://x/a.webp",
  image_path: "product/a.webp",
  sort_order: 10,
  is_active: true,
  ...patch,
});

beforeEach(() => sb.reset());

describe("catalog service", () => {
  it("readers list active items of one kind in display order", async () => {
    sb.on({ name: "catalog_items" }, { data: [item()] });
    expect(await catalog.listCatalog("product")).toHaveLength(1);
    const call = sb.find("catalog_items")[0];
    expect(call.ops.filter((o) => o.method === "eq").map((o) => o.args)).toEqual([["kind", "product"], ["is_active", true]]);
    expect(call.ops.filter((o) => o.method === "order").map((o) => o.args[0])).toEqual(["sort_order", "created_at"]);
  });

  it("admins also see hidden items", async () => {
    await catalog.adminListCatalog("studio_photo");
    const eqs = sb.find("catalog_items")[0].ops.filter((o) => o.method === "eq").map((o) => o.args);
    expect(eqs).toEqual([["kind", "studio_photo"]]);
  });

  it("errors surface", async () => {
    sb.on({ name: "catalog_items" }, { error: { message: "boom" } });
    await expect(catalog.listCatalog("product")).rejects.toMatchObject({ message: "boom" });
  });

  it("uploads to the catalog bucket under the kind folder and returns the public URL", async () => {
    const blob = new Blob(["x"], { type: "image/webp" });
    const res = await catalog.uploadCatalogImage("product", blob);
    expect(res.path).toMatch(/^product\/[0-9a-f-]{36}\.webp$/);
    expect(res.url).toBe(`https://mock.supabase.co/storage/v1/object/public/catalog/${res.path}`);
    expect(sb.storage.upload).toHaveBeenCalledWith(res.path, blob, expect.objectContaining({ contentType: "image/webp", upsert: false }));
  });

  it("JPEG fallback gets a .jpg name; a size error gets a clear message", async () => {
    const res = await catalog.uploadCatalogImage("studio_photo", new Blob(["x"], { type: "image/jpeg" }));
    expect(res.path).toMatch(/^studio_photo\/.+\.jpg$/);
    sb.storage.upload.mockResolvedValueOnce({ data: null, error: { message: "The object exceeded the maximum allowed size" } });
    await expect(catalog.uploadCatalogImage("product", new Blob(["x"], { type: "image/webp" }))).rejects.toThrow("512 KB");
  });

  it("insert cleans fields; studio photos never carry price or features", async () => {
    await catalog.saveCatalogItem({ ...item({ title: "  Phone  ", features: [" A ", "", "B"] }), id: undefined, sort_order: 40 });
    expect(opArgs(sb.find("catalog_items", "insert")[0], "insert")?.[0]).toMatchObject({ title: "Phone", features: ["A", "B"], price: 1000, sort_order: 40 });
    await catalog.saveCatalogItem({ ...item({ kind: "studio_photo", category: "weddings", price: 5, features: ["x"] }), id: undefined });
    expect(opArgs(sb.find("catalog_items", "insert")[1], "insert")?.[0]).toMatchObject({ kind: "studio_photo", price: null, features: [] });
  });

  it("update targets the item by id and does not touch its order", async () => {
    await catalog.saveCatalogItem({ ...item(), title: "New" });
    const call = sb.find("catalog_items", "update")[0];
    expect(opArgs(call, "update")?.[0]).not.toHaveProperty("sort_order");
    expect(opArgs(call, "eq")).toEqual(["id", "i1"]);
  });

  it("swapping order exchanges positions, even when they are equal", async () => {
    await catalog.swapCatalogOrder(item({ id: "a", sort_order: 20 }), item({ id: "b", sort_order: 10 }));
    let updates = sb.find("catalog_items", "update").map((c) => [opArgs(c, "eq")?.[1], (opArgs(c, "update")?.[0] as { sort_order: number }).sort_order]);
    expect(updates).toEqual([["a", 10], ["b", 20]]);
    sb.reset();
    await catalog.swapCatalogOrder(item({ id: "a", sort_order: 0 }), item({ id: "b", sort_order: 0 }));
    updates = sb.find("catalog_items", "update").map((c) => [opArgs(c, "eq")?.[1], (opArgs(c, "update")?.[0] as { sort_order: number }).sort_order]);
    expect(updates).toEqual([["a", 1], ["b", 0]]);
  });

  it("delete removes the row, then its uploaded photo; seeded rows without a path skip storage", async () => {
    await catalog.deleteCatalogItem(item());
    expect(opArgs(sb.find("catalog_items", "delete")[0], "eq")).toEqual(["id", "i1"]);
    expect(sb.storage.remove).toHaveBeenCalledWith(["product/a.webp"]);
    sb.storage.remove.mockClear();
    await catalog.deleteCatalogItem(item({ image_path: null }));
    expect(sb.storage.remove).not.toHaveBeenCalled();
  });

  it("a failed delete keeps the photo", async () => {
    sb.on({ name: "catalog_items", method: "delete" }, { error: { message: "rls" } });
    await expect(catalog.deleteCatalogItem(item())).rejects.toBeTruthy();
    expect(sb.storage.remove).not.toHaveBeenCalled();
  });
});
