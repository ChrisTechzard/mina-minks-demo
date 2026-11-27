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
  info: 'border-ink/12 bg-ivory text-ink',
  error: 'border-danger/25 bg-danger-light text-danger',
  success: 'border-success/25 bg-success-light text-success',
};

export default function Alert({ variant = 'info', title, children, className = '' }: AlertProps) {
  const Icon = variant === 'error' ? AlertCircle : variant === 'success' ? CheckCircle2 : Info;
  return (
    <div
      className={`flex gap-3 rounded-3xl border px-4 py-3.5 text-sm ${styles[variant]} ${className}`}
      role={variant === 'error' ? 'alert' : variant === 'success' ? 'status' : undefined}
    >
      <Icon size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div>
        {title ? <p className="mb-1 font-semibold">{title}</p> : null}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
