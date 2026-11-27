import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({ icon, title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center rounded-4xl border border-dashed border-ink/15 bg-ivory/50 px-6 py-12 text-center ${className}`}>
      {icon ? <div className="mb-4 text-ink-faint">{icon}</div> : null}
      <h3 className="text-2xl">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
