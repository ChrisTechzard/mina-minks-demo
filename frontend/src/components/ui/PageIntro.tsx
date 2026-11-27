import type { ReactNode } from 'react';

interface PageIntroProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  aside?: ReactNode;
  className?: string;
}

export default function PageIntro({ eyebrow, title, description, actions, aside, className = '' }: PageIntroProps) {
  return (
    <header className={`flex flex-wrap items-end justify-between gap-8 ${className}`}>
      <div className="max-w-3xl">
        <p className="eyebrow mb-4">{eyebrow}</p>
        <h1 className="text-5xl leading-[1.02] sm:text-6xl lg:text-[4.25rem]">{title}</h1>
        {description ? <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">{description}</p> : null}
        {actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      {aside ? <div className="flex shrink-0 items-end">{aside}</div> : null}
    </header>
  );
}
