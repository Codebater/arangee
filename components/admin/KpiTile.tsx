export function KpiTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-[--border] bg-[--surface] p-4">
      <div className="text-[11px] uppercase tracking-[0.08em] text-[--ink-muted]">{label}</div>
      <div className="mt-2 font-mono text-[28px] leading-none tabular text-[--ink]">{value}</div>
      {hint && <div className="mt-1.5 text-[11px] text-[--ink-muted]">{hint}</div>}
    </div>
  );
}
