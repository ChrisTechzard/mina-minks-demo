import type { ReactNode } from 'react';

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export default function SectionHeading({ eyebrow, title, description, action, className = '' }: SectionHeadingProps) {
  return (
    <div className={`flex flex-wrap items-end justify-between gap-6 ${className}`}>
      <div className="max-w-2xl">
        {eyebrow ? <p className="eyebrow mb-3 text-accent-deep">{eyebrow}</p> : null}
        <h2 className="text-4xl leading-tight sm:text-5xl">{title}</h2>
        {description ? <p className="mt-4 max-w-xl text-sm leading-relaxed text-ink-muted">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
