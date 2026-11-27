const STATUS_STYLES: Record<string, string> = {
  pending: 'border-warning/25 bg-warning-light text-warning',
  confirmed: 'border-success/25 bg-success-light text-success',
  completed: 'border-ink/15 bg-ink/5 text-ink-soft',
  cancelled: 'border-danger/25 bg-danger-light text-danger',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? 'border-ink/15 bg-white text-ink-muted';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider ${style} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
