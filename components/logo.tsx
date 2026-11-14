export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}>
      <span
        aria-hidden
        className="grid size-7 place-items-center rounded-lg bg-accent text-sm font-bold text-accent-fg"
      >
        ₦
      </span>
      NairaMeter
    </span>
  );
}
