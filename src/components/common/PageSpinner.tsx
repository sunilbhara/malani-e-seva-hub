export function PageSpinner({ label = "लोड हो रहा है…" }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
      <span aria-hidden className="h-8 w-8 animate-spin rounded-full border-[3px] border-muted border-t-primary" />
      <span className="font-hindi text-small text-muted-foreground">{label}</span>
    </div>
  );
}
