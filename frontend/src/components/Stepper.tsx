interface StepperProps {
  steps: string[];
  current: number;
}

export default function Stepper({ steps, current }: StepperProps) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Booking progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={`grid h-7 w-7 place-items-center rounded-full border text-[11px] font-bold ${
                active
                  ? 'border-ink bg-accent text-ink'
                  : done
                    ? 'border-ink bg-ink text-cream'
                    : 'border-ink/20 text-ink/40'
              }`}
            >
              {done ? '✓' : index + 1}
            </span>
            <span className={`hidden text-[11px] font-semibold uppercase tracking-wider sm:inline ${active ? 'text-ink' : 'text-ink/45'}`}>
              {step}
            </span>
            {index < steps.length - 1 ? <span className="mx-1 h-px w-5 bg-ink/15 sm:w-8" /> : null}
          </li>
        );
      })}
    </ol>
  );
}
