interface BrandMarkProps {
  light?: boolean;
  compact?: boolean;
  className?: string;
}

export default function BrandMark({ light = false, compact = false, className = '' }: BrandMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full border font-display font-semibold tracking-wide ${
        compact ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'
      } ${light ? 'border-cream/45 text-cream' : 'border-ink/70 text-ink'} ${className}`}
    >
      MM
    </span>
  );
}
