export function KpiTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-xl border border-[--color-border] bg-[--color-surface] p-5">
      <div className="text-xs uppercase tracking-wide text-[--color-ink-muted]">{label}</div>
      <div className="mt-2 font-mono text-3xl tabular text-[--color-ink]">{value}</div>
      {hint && <div className="mt-1 text-xs text-[--color-ink-muted]">{hint}</div>}
    </div>
  );
}
