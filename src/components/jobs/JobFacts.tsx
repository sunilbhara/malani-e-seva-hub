import { cn } from "@/lib/utils";
import { daysUntil, formatDate, formatNumber, formatRupees } from "@/lib/format";
import { departmentLabel, parseExtraDates, parseFees, qualificationLabel, stateLabel } from "@/lib/jobs";
import type { JobRow } from "@/services/posts";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-caption font-normal text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-hindi text-body font-semibold text-foreground tabular">{value}</dd>
    </div>
  );
}

/** Quick Facts card at the top of every job post (Blueprint §9.2, audit U2). */
export function QuickFacts({ job, className }: { job: JobRow; className?: string }) {
  const quals = job.qualifications.filter((q) => q !== "any").map(qualificationLabel);
  const fees = parseFees(job.fees);
  const feeText = fees.length
    ? Array.from(new Set(fees.map((f) => formatRupees(f.amount)))).slice(0, 3).join(" / ")
    : "";
  const age = job.age_min && job.age_max ? `${job.age_min}–${job.age_max} वर्ष` : job.age_max ? `अधिकतम ${job.age_max} वर्ष` : job.age_min ? `न्यूनतम ${job.age_min} वर्ष` : "";
  const facts = [
    job.total_posts ? { label: "कुल पद", value: formatNumber(job.total_posts) } : null,
    quals.length ? { label: "योग्यता", value: quals.join(", ") } : job.qualifications.includes("any") ? { label: "योग्यता", value: "कोई भी" } : null,
    age ? { label: "आयु सीमा", value: age } : null,
    feeText ? { label: "आवेदन शुल्क", value: feeText } : null,
    job.salary ? { label: "वेतन", value: job.salary } : null,
    { label: "क्षेत्र", value: [stateLabel(job.state), ...job.departments.map(departmentLabel)].filter(Boolean).slice(0, 2).join(" · ") },
  ].filter((f): f is { label: string; value: string } => Boolean(f?.value));

  return (
    <section aria-label="मुख्य जानकारी" className={cn("rounded-2xl border bg-secondary/40 p-4 sm:p-5", className)}>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">
        {facts.map((f) => (
          <Fact key={f.label} label={f.label} value={f.value} />
        ))}
      </dl>
    </section>
  );
}

interface DateRow {
  label: string;
  date: string;
}

export function jobDateRows(job: JobRow): DateRow[] {
  const rows: Array<DateRow | null> = [
    job.apply_start ? { label: "आवेदन शुरू", date: job.apply_start } : null,
    job.last_date ? { label: "आवेदन की अंतिम तिथि", date: job.last_date } : null,
    job.fee_last_date ? { label: "शुल्क जमा करने की अंतिम तिथि", date: job.fee_last_date } : null,
    job.admit_card_date ? { label: "एडमिट कार्ड", date: job.admit_card_date } : null,
    job.exam_date ? { label: "परीक्षा तिथि", date: job.exam_date } : null,
    job.result_date ? { label: "रिजल्ट", date: job.result_date } : null,
    ...parseExtraDates(job.extra_dates),
  ];
  return rows.filter((r): r is DateRow => Boolean(r)).sort((a, b) => a.date.localeCompare(b.date));
}

/** Important dates: the next upcoming date is highlighted, past dates are struck through (Blueprint §10.3). */
export function DatesTable({ job, className }: { job: JobRow; className?: string }) {
  const rows = jobDateRows(job);
  if (!rows.length) return null;
  const nextIndex = rows.findIndex((r) => (daysUntil(r.date) ?? -1) >= 0);
  return (
    <section className={className} aria-labelledby="dates-heading">
      <h2 id="dates-heading" className="mb-3 font-hindi text-lg font-bold">महत्वपूर्ण तिथियाँ</h2>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full font-hindi text-small">
          <tbody>
            {rows.map((row, i) => {
              const past = (daysUntil(row.date) ?? 0) < 0;
              return (
                <tr key={`${row.label}-${row.date}`} className={cn("border-b last:border-0", i === nextIndex ? "bg-secondary/60" : i % 2 ? "bg-muted/40" : "bg-card")}>
                  <th scope="row" className={cn("px-3 py-2.5 text-left font-medium", past ? "text-muted-foreground line-through" : "text-foreground")}>
                    {row.label}
                    {i === nextIndex ? <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[0.6875rem] font-semibold text-primary-foreground no-underline">अगली</span> : null}
                  </th>
                  <td className={cn("px-3 py-2.5 text-right font-semibold tabular", past ? "text-muted-foreground line-through" : "text-foreground")}>
                    {formatDate(row.date)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function FeeTable({ job, className }: { job: JobRow; className?: string }) {
  const fees = parseFees(job.fees);
  if (!fees.length) return null;
  return (
    <section className={className} aria-labelledby="fees-heading">
      <h2 id="fees-heading" className="mb-3 font-hindi text-lg font-bold">आवेदन शुल्क</h2>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full font-hindi text-small">
          <tbody>
            {fees.map((fee, i) => (
              <tr key={`${fee.category}-${i}`} className={cn("border-b last:border-0", i % 2 ? "bg-muted/40" : "bg-card")}>
                <th scope="row" className="px-3 py-2.5 text-left font-medium">{fee.category}</th>
                <td className="px-3 py-2.5 text-right font-semibold tabular">{formatRupees(fee.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
