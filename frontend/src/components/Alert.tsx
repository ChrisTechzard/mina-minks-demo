import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type AlertVariant = 'info' | 'error' | 'success';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

const styles: Record<AlertVariant, string> = {
  info: 'border-ink/15 bg-white/70 text-ink',
  error: 'border-red-800/25 bg-red-50 text-red-900',
  success: 'border-ink/15 bg-accent/25 text-ink',
};

export default function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info;
  return (
    <div className={`flex gap-3 rounded-2xl border px-4 py-3 text-sm ${styles[variant]} ${className}`}>
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="mb-1 font-semibold">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
