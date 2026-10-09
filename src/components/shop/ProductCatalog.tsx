import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownWideNarrow, MessageCircle, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { LoadingLabel, Skeleton } from "@/components/common/Skeleton";
import { whatsappHref } from "@/lib/business";
import { discountPercent, formatPrice } from "@/lib/catalogImage";
import { queryKeys } from "@/lib/queryClient";
import { track } from "@/lib/analytics";
import { getShopCatalog, type CatalogCollection, type CatalogItem } from "@/services/catalog";
import { useI18n } from "@/i18n";
import { cn } from "@/lib/utils";

type Sort = "featured" | "price-asc" | "price-desc" | "discount";
const SORTS: Array<{ value: Sort; label: string }> = [
  { value: "featured", label: "हमारी पसंद" },
  { value: "price-asc", label: "कम दाम पहले" },
  { value: "price-desc", label: "ज़्यादा दाम पहले" },
  { value: "discount", label: "सबसे ज़्यादा छूट" },
];

function sortItems(items: CatalogItem[], sort: Sort): CatalogItem[] {
  const priced = (p: CatalogItem, fallback: number) => p.price ?? fallback;
  switch (sort) {
    case "price-asc":
      return [...items].sort((a, b) => priced(a, Infinity) - priced(b, Infinity));
    case "price-desc":
      return [...items].sort((a, b) => priced(b, -1) - priced(a, -1));
    case "discount":
      return [...items].sort((a, b) => (discountPercent(b.price, b.mrp) ?? 0) - (discountPercent(a.price, a.mrp) ?? 0));
    default:
      return items;
  }
}

const askText = (p: CatalogItem) => `नमस्ते, मुझे ${p.title} चाहिए${p.price !== null ? ` (${formatPrice(p.price)})` : ""}। क्या यह उपलब्ध है?`;

function PriceBlock({ p, large = false }: { p: CatalogItem; large?: boolean }) {
  const price = formatPrice(p.price);
  const mrp = formatPrice(p.mrp);
  const off = discountPercent(p.price, p.mrp);
  if (!price) return <p className="font-hindi text-small font-semibold text-muted-foreground">दाम के लिए पूछें</p>;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn("font-bold tabular text-foreground", large ? "text-2xl" : "text-lg")}>{price}</span>
      {off && (
        <>
          <span className="text-small text-muted-foreground line-through tabular" aria-label={`MRP ${mrp}`}>
            {mrp}
          </span>
          <span className="font-hindi text-small font-bold text-status-open">{off}% छूट</span>
        </>
      )}
    </p>
  );
}

function ProductCard({ p, onOpen }: { p: CatalogItem; onOpen: (p: CatalogItem) => void }) {
  const off = discountPercent(p.price, p.mrp);
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-1 transition-shadow hover:shadow-2">
      <button type="button" onClick={() => onOpen(p)} className="relative block bg-white text-left" aria-label={`${p.title} — पूरी जानकारी`}>
        <img src={p.image_url} alt={p.title} width={800} height={800} loading="lazy" decoding="async" className="aspect-square w-full object-contain p-2 transition-transform duration-300 group-hover:scale-[1.03]" />
        {off && (
          <span className="absolute left-2 top-2 rounded-md bg-status-urgent px-2 py-0.5 font-hindi text-caption text-white">{off}% छूट</span>
        )}
      </button>
      <div className="flex flex-1 flex-col gap-1.5 border-t p-3 sm:p-4">
        <h3 className="line-clamp-2 min-h-[2.75rem] font-semibold leading-snug">
          <button type="button" onClick={() => onOpen(p)} className="text-left hover:underline">
            {p.title}
          </button>
        </h3>
        <PriceBlock p={p} />
        {p.features.length > 0 && <p className="line-clamp-1 text-caption font-normal text-muted-foreground">{p.features.slice(0, 3).join(" · ")}</p>}
        <Button asChild variant="whatsapp" size="sm" className="mt-auto font-hindi">
          <a href={whatsappHref(askText(p))} target="_blank" rel="noopener noreferrer" onClick={() => track("product_enquiry", { product: p.title })}>
            <MessageCircle /> WhatsApp पर पूछें
          </a>
        </Button>
      </div>
    </article>
  );
}

function ProductGrid({ items, onOpen }: { items: CatalogItem[]; onOpen: (p: CatalogItem) => void }) {
  return (
    <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
      {items.map((p) => (
        <li key={p.id}>
          <ProductCard p={p} onOpen={onOpen} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4" aria-busy="true">
      <LoadingLabel text="प्रोडक्ट लोड हो रहे हैं…" />
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border bg-card">
          <Skeleton className="aspect-square rounded-none" />
          <div className="space-y-2 p-3 sm:p-4">
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** E-commerce style catalog: collections and categories as filters, sortable 2–4 column grid, detail sheet. */
export function ProductCatalog() {
  const { messages } = useI18n();
  const categories = messages.homepage.mobileElectronics.categories.filter((c) => c.id !== "all");
  const { data, isLoading, isError } = useQuery({ queryKey: queryKeys.catalog("shop"), queryFn: getShopCatalog });
  const [filter, setFilter] = useState<string>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [open, setOpen] = useState<CatalogItem | null>(null);

  const products = useMemo(() => data?.products ?? [], [data]);
  const collections = useMemo(() => (data?.collections ?? []).filter((c) => c.item_ids.length > 0), [data]);
  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const itemsOf = (c: CatalogCollection) => c.item_ids.map((id) => byId.get(id)).filter((p): p is CatalogItem => Boolean(p));

  const filters = [
    { id: "all", label: "सभी" },
    ...collections.map((c) => ({ id: `c:${c.id}`, label: c.title })),
    ...categories.filter((c) => products.some((p) => p.category === c.id)).map((c) => ({ id: `cat:${c.id}`, label: c.name })),
  ];

  const filtered = useMemo(() => {
    if (filter.startsWith("c:")) {
      const c = collections.find((x) => `c:${x.id}` === filter);
      return c ? itemsOf(c) : [];
    }
    if (filter.startsWith("cat:")) return products.filter((p) => `cat:${p.category}` === filter);
    return products;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, products, collections]);
  const shown = sortItems(filtered, sort);
  const showSections = filter === "all" && sort === "featured" && collections.length > 0;

  return (
    <section aria-labelledby="products-heading" className="space-y-4">
      <div>
        <h2 id="products-heading" className="flex items-center gap-2.5 font-hindi text-xl font-bold sm:text-2xl">
          <span aria-hidden className="h-5 w-1.5 shrink-0 rounded-full bg-accent" />
          {messages.homepage.mobileElectronics.title}
        </h2>
        <p className="mt-1 font-hindi text-small text-muted-foreground">दाम बदल सकते हैं — ताज़ा दाम और उपलब्धता के लिए WhatsApp करें।</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="rail-fade -mx-4 min-w-0 flex-1 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0 sm:[mask-image:none]">
          <div className="flex gap-2" role="group" aria-label="प्रोडक्ट फ़िल्टर">
            {filters.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filter === f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "h-11 shrink-0 rounded-full border px-4 font-hindi text-small font-semibold transition-colors",
                  filter === f.id ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <label className="flex h-11 items-center gap-2 rounded-full border bg-card pl-3 pr-1 font-hindi text-small">
          <ArrowDownWideNarrow aria-hidden className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">क्रम</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-9 bg-transparent pr-2 font-semibold focus:outline-none">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </label>
      </div>

      {isLoading ? (
        <ProductGridSkeleton />
      ) : isError ? (
        <p className="rounded-xl border bg-card p-6 text-center font-hindi text-small text-muted-foreground">प्रोडक्ट अभी लोड नहीं हो सके। कृपया थोड़ी देर बाद देखें या WhatsApp करें।</p>
      ) : shown.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-8 text-center">
          <PackageSearch aria-hidden className="h-8 w-8 text-muted-foreground" />
          <p className="font-hindi text-small text-muted-foreground">इस श्रेणी में अभी कोई प्रोडक्ट नहीं है। जानकारी के लिए WhatsApp करें।</p>
        </div>
      ) : showSections ? (
        <div className="space-y-8">
          {collections.map((c) => (
            <section key={c.id} aria-labelledby={`col-${c.id}`} className="space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <h3 id={`col-${c.id}`} className="font-hindi text-lg font-bold">{c.title}</h3>
                  {c.description && <p className="font-hindi text-small text-muted-foreground">{c.description}</p>}
                </div>
                {c.item_ids.length > 4 && (
                  <button type="button" onClick={() => setFilter(`c:${c.id}`)} className="shrink-0 font-hindi text-small font-semibold text-link">
                    सभी {c.item_ids.length} देखें
                  </button>
                )}
              </div>
              <ProductGrid items={itemsOf(c).slice(0, 8)} onOpen={setOpen} />
            </section>
          ))}
          <section aria-labelledby="all-products" className="space-y-3">
            <h3 id="all-products" className="font-hindi text-lg font-bold">सभी प्रोडक्ट ({products.length})</h3>
            <ProductGrid items={products} onOpen={setOpen} />
          </section>
        </div>
      ) : (
        <ProductGrid items={shown} onOpen={setOpen} />
      )}

      <Dialog open={Boolean(open)} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto p-0">
          {open && (
            <div className="grid sm:grid-cols-2">
              <img src={open.image_url} alt={open.title} className="aspect-square w-full bg-white object-contain p-3" />
              <div className="flex flex-col gap-3 p-5">
                <DialogTitle className="text-xl font-bold leading-snug">{open.title}</DialogTitle>
                <DialogDescription asChild>
                  <div>
                    <PriceBlock p={open} large />
                  </div>
                </DialogDescription>
                {open.features.length > 0 && (
                  <ul className="space-y-1.5">
                    {open.features.map((f) => (
                      <li key={f} className="flex gap-2 text-small">
                        <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                        {f}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="font-hindi text-small text-muted-foreground">दुकान पर देखें या WhatsApp पर उपलब्धता पूछें। दाम बदल सकते हैं।</p>
                <Button asChild variant="whatsapp" size="lg" className="mt-auto font-hindi">
                  <a href={whatsappHref(askText(open))} target="_blank" rel="noopener noreferrer" onClick={() => track("product_enquiry", { product: open.title, from: "detail" })}>
                    <MessageCircle /> WhatsApp पर ऑर्डर / पूछें
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
