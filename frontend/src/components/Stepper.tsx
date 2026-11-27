import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <nav aria-label="Booking progress">
      <ol className="flex flex-wrap items-center gap-1.5 sm:gap-3">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={step} className="flex items-center gap-1.5 sm:gap-2.5">
              <span
                aria-current={active ? 'step' : undefined}
                className={`grid h-8 w-8 place-items-center rounded-full border text-[11px] font-semibold transition duration-200 ${
                  active
                    ? 'border-ink bg-ink text-accent'
                    : done
                      ? 'border-accent-deep/40 bg-accent/60 text-ink'
                      : 'border-ink/15 bg-ivory/50 text-ink-faint'
                }`}
              >
                {done ? <Check size={14} aria-hidden="true" /> : index + 1}
                <span className="sr-only">{step}</span>
              </span>
              <span className={`hidden text-[11px] font-semibold uppercase tracking-wider lg:inline ${active ? 'text-ink' : 'text-ink-faint'}`}>
                {step}
              </span>
              {index < steps.length - 1 ? <span aria-hidden="true" className="h-px w-4 bg-ink/15 sm:w-6" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
