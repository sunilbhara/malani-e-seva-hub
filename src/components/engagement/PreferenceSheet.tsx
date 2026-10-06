import { useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS, QUALIFICATIONS } from "@/lib/jobs";
import { loadPreferences, savePreferences, topicsFor } from "@/lib/preferences";
import { updatePushTopics } from "@/lib/push";
import { useAuth } from "@/hooks/useAuth";
import { saveRemotePreferences } from "@/services/profile";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const DISTRICTS = [
  { value: "barmer", label: "बाड़मेर" },
  { value: "rajasthan_other", label: "राजस्थान का अन्य ज़िला" },
  { value: "other_state", label: "दूसरा राज्य" },
];

function Chip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 font-hindi text-small font-semibold transition-colors",
        selected ? "border-primary bg-primary text-primary-foreground" : "bg-card text-foreground hover:bg-muted",
      )}
    >
      {selected && <Check aria-hidden className="h-4 w-4" />}
      {children}
    </button>
  );
}

/** "3 सवाल, फिर सिर्फ़ आपकी नौकरियाँ" — no login needed (Blueprint §9.5). */
export default function PreferenceSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const initial = loadPreferences();
  const [qualification, setQualification] = useState<string | null>(initial.qualification);
  const [departments, setDepartments] = useState<string[]>(initial.departments);
  const [district, setDistrict] = useState<string | null>(initial.district ?? "barmer");
  const [saving, setSaving] = useState(false);

  function toggleDept(value: string) {
    setDepartments((current) => (current.includes(value) ? current.filter((d) => d !== value) : [...current, value]));
  }

  async function onSave() {
    setSaving(true);
    const prefs = savePreferences({ qualification, departments, district, completedAt: new Date().toISOString() });
    try {
      if (user) await saveRemotePreferences(user.id, prefs);
      await updatePushTopics(topicsFor(prefs)).catch(() => undefined);
      track("preferences_saved", { qualification: qualification ?? "none", departments: departments.length });
      toast.success("आपकी पसंद सेव हो गई। अब होम पर आपके लिए नौकरियाँ दिखेंगी।");
      onOpenChange(false);
    } catch {
      toast.error("पसंद सेव नहीं हो सकी।");
    } finally {
      setSaving(false);
    }
  }

  function onSkip() {
    savePreferences({ dismissedAt: new Date().toISOString() });
    onOpenChange(false);
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) onSkip();
        else onOpenChange(next);
      }}
    >
      <SheetContent side="bottom" className="mx-auto max-w-2xl">
        <SheetHeader className="text-left">
          <SheetTitle className="font-hindi text-xl">3 सवाल, फिर सिर्फ़ आपकी नौकरियाँ</SheetTitle>
          <SheetDescription className="font-hindi">आपकी पसंद इसी फ़ोन में सेव रहेगी। कभी भी प्रोफ़ाइल से बदल सकते हैं।</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <fieldset>
            <legend className="mb-3 font-hindi font-semibold">1. आपकी योग्यता?</legend>
            <div className="flex flex-wrap gap-2">
              {QUALIFICATIONS.filter((q) => q.value !== "any").map((q) => (
                <Chip key={q.value} selected={qualification === q.value} onClick={() => setQualification(qualification === q.value ? null : q.value)}>
                  {q.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-hindi font-semibold">2. किस तरह की नौकरी? <span className="font-normal text-muted-foreground">(एक से ज़्यादा चुनें)</span></legend>
            <div className="flex flex-wrap gap-2">
              {DEPARTMENTS.filter((d) => d.value !== "other").map((d) => (
                <Chip key={d.value} selected={departments.includes(d.value)} onClick={() => toggleDept(d.value)}>
                  {d.label}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-3 font-hindi font-semibold">3. आपका ज़िला?</legend>
            <div className="flex flex-wrap gap-2">
              {DISTRICTS.map((d) => (
                <Chip key={d.value} selected={district === d.value} onClick={() => setDistrict(d.value)}>
                  {d.label}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onSkip} className="font-hindi">अभी नहीं</Button>
          <Button type="button" onClick={() => void onSave()} disabled={saving || (!qualification && departments.length === 0)} size="lg" className="font-hindi">
            {saving ? "सेव हो रहा है…" : "मेरी नौकरियाँ दिखाएँ"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
