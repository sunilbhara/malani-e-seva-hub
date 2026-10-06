import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS, QUALIFICATIONS, STATES } from "@/lib/jobs";
import { listPosts } from "@/services/posts";
import { cn } from "@/lib/utils";

export interface ListingFilters {
  q: string;
  qualification: string;
  department: string;
  state: string;
  status: string;
  sort: string;
}

export const EMPTY_FILTERS: ListingFilters = { q: "", qualification: "", department: "", state: "", status: "", sort: "latest" };

const STATUS_OPTIONS = [
  { value: "", label: "सभी" },
  { value: "active", label: "आवेदन जारी" },
  { value: "closing", label: "अंतिम तिथि नज़दीक" },
  { value: "upcoming", label: "जल्द शुरू" },
  { value: "closed", label: "आवेदन बंद" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "नवीनतम" },
  { value: "deadline", label: "अंतिम तिथि पहले" },
  { value: "posts", label: "ज़्यादा पद" },
  { value: "trending", label: "लोकप्रिय" },
];

function Group({ legend, options, value, onChange }: { legend: string; options: ReadonlyArray<{ value: string; label: string }>; value: string; onChange: (v: string) => void }) {
  return (
    <fieldset>
      <legend className="mb-2.5 font-hindi font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value || "all"}
            type="button"
            aria-pressed={value === o.value}
            onClick={() => onChange(value === o.value && o.value ? "" : o.value)}
            className={cn(
              "min-h-10 rounded-full border px-3.5 font-hindi text-small font-semibold transition-colors",
              value === o.value ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

/** Filter bottom sheet with a live result count on the apply button. */
export function FilterSheet({
  open,
  onOpenChange,
  value,
  onApply,
  postTypes,
  jobFilters,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: ListingFilters;
  onApply: (filters: ListingFilters) => void;
  postTypes?: string[];
  jobFilters: boolean;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  const count = useQuery({
    queryKey: ["filter-count", postTypes, draft],
    queryFn: () =>
      listPosts({
        postTypes,
        search: draft.q,
        qualification: draft.qualification,
        department: draft.department,
        state: draft.state,
        jobStatus: (draft.status || undefined) as never,
        limit: 1,
      }),
    enabled: open,
  });

  const set = (key: keyof ListingFilters) => (v: string) => setDraft((d) => ({ ...d, [key]: v }));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-hindi text-xl">फ़िल्टर</SheetTitle>
          <SheetDescription className="font-hindi">अपनी योग्यता और पसंद से नौकरियाँ छाँटें।</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          {jobFilters && (
            <>
              <Group legend="योग्यता" options={QUALIFICATIONS.filter((q) => q.value !== "any")} value={draft.qualification} onChange={set("qualification")} />
              <Group legend="विभाग" options={DEPARTMENTS} value={draft.department} onChange={set("department")} />
              <Group legend="क्षेत्र" options={STATES} value={draft.state} onChange={set("state")} />
              <Group legend="स्थिति" options={STATUS_OPTIONS} value={draft.status} onChange={set("status")} />
            </>
          )}
          <Group legend="क्रम" options={SORT_OPTIONS} value={draft.sort} onChange={(v) => set("sort")(v || "latest")} />
        </div>
        <div className="mt-8 flex gap-2">
          <Button type="button" variant="outline" className="font-hindi" onClick={() => setDraft({ ...EMPTY_FILTERS, q: draft.q })}>
            साफ़ करें
          </Button>
          <Button type="button" size="lg" className="flex-1 font-hindi" onClick={() => onApply(draft)}>
            दिखाएँ {count.data ? `(${count.data.total})` : ""}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
