interface DemoBadgeProps {
  className?: string;
}

export default function DemoBadge({ className = '' }: DemoBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-ink/15 bg-ivory/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-editorial text-ink-muted ${className}`}
    >
      Sample / demo data
    </span>
  );
}
