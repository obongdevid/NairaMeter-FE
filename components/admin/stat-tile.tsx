export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "danger";
}) {
  const color = tone === "accent" ? "text-accent" : tone === "danger" ? "text-danger" : "";
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
      <p className={`tabular mt-2 text-3xl font-semibold tracking-tight ${color}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
