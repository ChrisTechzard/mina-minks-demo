import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  label?: string;
  className?: string;
}

export default function Spinner({ label = 'Loading…', className = '' }: SpinnerProps) {
  return (
    <div className={`flex items-center justify-center gap-2 text-sm text-ink/60 ${className}`} role="status">
      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
