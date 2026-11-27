import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, RotateCcw, Sparkles } from 'lucide-react';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import DemoBadge from '../components/DemoBadge';
import ImageWithFallback from '../components/ImageWithFallback';
import EmptyState from '../components/ui/EmptyState';
import PageIntro from '../components/ui/PageIntro';
import { useServices } from '../hooks/useServices';
import { recommend } from '../services/recommendation';
import type { FinishAnswer, LookAnswer, RecommendationAnswers, VisitAnswer } from '../services/recommendation';
import { formatDuration, formatPrice } from '../services/format';

type AnswerKey = keyof RecommendationAnswers;

const QUESTIONS: Array<{ key: AnswerKey; question: string; hint: string }> = [
  { key: 'look', question: 'What look feels most like you?', hint: 'Choose the mood you would enjoy wearing every day.' },
  { key: 'firstVisit', question: 'Is this your first lash appointment?', hint: 'Your answer changes the sample starting point.' },
  { key: 'finish', question: 'Natural or dramatic?', hint: 'Think about the finish you want most often.' },
  { key: 'visit', question: 'Full set or maintenance?', hint: 'Not sure yet? That is a useful answer too.' },
];

function isComplete(value: Partial<RecommendationAnswers>): value is RecommendationAnswers {
  return (
    value.look !== undefined &&
    value.firstVisit !== undefined &&
    value.finish !== undefined &&
    value.visit !== undefined
  );
}

interface OptionButtonProps {
  label: string;
  hint: string;
  selected: boolean;
  onClick: () => void;
}

function OptionButton({ label, hint, selected, onClick }: OptionButtonProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`flex min-h-[72px] w-full items-center justify-between gap-4 rounded-3xl border px-5 py-4 text-left transition duration-200 ${
        selected
          ? 'border-ink bg-accent/35 shadow-lift'
          : 'border-ink/12 bg-ivory hover:border-ink/45 hover:bg-white'
      }`}
    >
      <span>
        <span className="block font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{hint}</span>
      </span>
      <span
        aria-hidden="true"
        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-ink transition ${
          selected ? 'border-ink bg-ink text-accent' : 'border-ink/25'
        }`}
      >
        {selected ? <Check size={14} /> : null}
      </span>
    </button>
  );
}

export default function RecommendationPage() {
  const { services, loading, error, reload } = useServices();
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Partial<RecommendationAnswers>>({});
  const [overrideId, setOverrideId] = useState<number | null>(null);
  const overrideRef = useRef<HTMLSelectElement>(null);
  const stageRef = useRef<HTMLHeadingElement>(null);
  const resultPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    stageRef.current?.focus({ preventScroll: true });
  }, [step]);

  function choose<K extends AnswerKey>(key: K, value: RecommendationAnswers[K]): void {
    setAnswers((previous: Partial<RecommendationAnswers>) => ({ ...previous, [key]: value }));
    setOverrideId(null);
    setStep((current: number) => Math.min(current + 1, QUESTIONS.length));
  }

  const result = useMemo(() => {
    if (!isComplete(answers)) return null;
    return recommend(answers, services);
  }, [answers, services]);

  const selectedService = services.find(
    (service) => service.id === (overrideId ?? result?.serviceId),
  ) ?? null;

  useEffect(() => {
    if (step === QUESTIONS.length && !selectedService && !loading) {
      resultPanelRef.current?.focus({ preventScroll: true });
    }
  }, [step, selectedService, loading]);

  const reset = (): void => {
    setAnswers({});
    setOverrideId(null);
    setStep(0);
  };

  const focusOverride = (): void => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    overrideRef.current?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'center' });
    overrideRef.current?.focus({ preventScroll: true });
  };

  return (
    <div className="page-shell py-14 sm:py-20">
      <PageIntro
        eyebrow="Style finder"
        title="Find your lash language."
        description="Four short questions produce an explainable suggestion from the sample menu. No external AI is used, and your choice always wins."
        aside={<DemoBadge />}
      />

      <div className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface p-6 sm:p-9">
          <p className="sr-only" role="status">
            {step < QUESTIONS.length
              ? `Question ${step + 1} of ${QUESTIONS.length}: ${QUESTIONS[step].question}`
              : selectedService
                ? `Suggestion ready: ${selectedService.name}.`
                : error
                  ? `Menu unavailable. ${error}`
                  : 'Suggestion unavailable.'}
          </p>
          {step < QUESTIONS.length ? (
            <div className="animate-fade-up" key={QUESTIONS[step].key}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="text-[11px] font-semibold uppercase tracking-editorial text-ink-muted">
                  Question {step + 1} of {QUESTIONS.length}
                </p>
                <div className="flex gap-1.5" aria-hidden="true">
                  {QUESTIONS.map((question, index) => (
                    <span key={question.key} className={`h-1.5 w-8 rounded-full transition-colors duration-300 ${index <= step ? 'bg-accent-deep' : 'bg-ink/10'}`} />
                  ))}
                </div>
              </div>
              <h2 ref={stageRef} tabIndex={-1} className="mt-8 text-3xl leading-tight focus:outline-none sm:text-4xl">{QUESTIONS[step].question}</h2>
              <p className="mt-2 text-sm text-ink-muted">{QUESTIONS[step].hint}</p>

              <div className="mt-7 space-y-3">
                {step === 0 ? (
                  <>
                    <OptionButton label="Everyday natural" hint="Barely-there, polished." selected={answers.look === 'natural'} onClick={() => choose('look', 'natural' as LookAnswer)} />
                    <OptionButton label="Soft definition" hint="A little shape, still subtle." selected={answers.look === 'soft'} onClick={() => choose('look', 'soft' as LookAnswer)} />
                    <OptionButton label="Full glamour" hint="I want my lashes noticed." selected={answers.look === 'glamour'} onClick={() => choose('look', 'glamour' as LookAnswer)} />
                  </>
                ) : null}
                {step === 1 ? (
                  <>
                    <OptionButton label="Yes, first time" hint="A gentle starting point." selected={answers.firstVisit === true} onClick={() => choose('firstVisit', true)} />
                    <OptionButton label="No, I've had lashes before" hint="Let's refine your usual style." selected={answers.firstVisit === false} onClick={() => choose('firstVisit', false)} />
                  </>
                ) : null}
                {step === 2 ? (
                  <>
                    <OptionButton label="Natural finish" hint="Clean and understated." selected={answers.finish === 'natural'} onClick={() => choose('finish', 'natural' as FinishAnswer)} />
                    <OptionButton label="Dramatic finish" hint="Bold and expressive." selected={answers.finish === 'dramatic'} onClick={() => choose('finish', 'dramatic' as FinishAnswer)} />
                  </>
                ) : null}
                {step === 3 ? (
                  <>
                    <OptionButton label="Full set" hint="Starting fresh." selected={answers.visit === 'full'} onClick={() => choose('visit', 'full' as VisitAnswer)} />
                    <OptionButton label="Maintenance" hint="Refill or tidy-up." selected={answers.visit === 'maintenance'} onClick={() => choose('visit', 'maintenance' as VisitAnswer)} />
                    <OptionButton label="I'm not sure" hint="Suggest a consultation." selected={answers.visit === 'unsure'} onClick={() => choose('visit', 'unsure' as VisitAnswer)} />
                  </>
                ) : null}
              </div>

              {step > 0 ? (
                <button type="button" className="btn-quiet -ml-4 mt-7" onClick={() => setStep((current: number) => current - 1)}>
                  <ArrowLeft size={15} aria-hidden="true" /> Previous question
                </button>
              ) : null}
            </div>
          ) : (
            <div ref={resultPanelRef} tabIndex={-1} className="animate-fade-up focus:outline-none">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="eyebrow">Your sample suggestion</p>
                <button type="button" className="btn-quiet -mr-4" onClick={reset}>
                  <RotateCcw size={14} aria-hidden="true" /> Start over
                </button>
              </div>

              {loading ? <Spinner label="Matching the sample menu…" className="py-12" /> : null}
              {error ? (
                <div className="mt-6 space-y-4">
                  <Alert variant="error" title="Menu unavailable">{error}</Alert>
                  <button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>
                </div>
              ) : null}
              {!loading && !error && services.length === 0 ? (
                <EmptyState
                  className="mt-8"
                  title="The sample menu is empty."
                  description="Suggestions will appear once the studio configures its services."
                  action={<button type="button" className="btn-outline" onClick={() => void reload()}>Try again</button>}
                />
              ) : null}
              {!loading && !error && services.length > 0 && !selectedService ? (
                <EmptyState className="mt-8" title="No service available." description="The sample menu could not produce a suggestion right now." />
              ) : null}

              {!loading && !error && selectedService ? (
                <>
                  <h2 ref={stageRef} tabIndex={-1} className="mt-7 text-4xl leading-tight focus:outline-none sm:text-5xl">{selectedService.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">{selectedService.description}</p>
                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <span className="font-semibold">{formatPrice(selectedService.price_ghs)}</span>
                    <span className="text-ink-muted">{formatDuration(selectedService.duration_minutes)}</span>
                    <span className="text-ink-muted">{selectedService.category}</span>
                  </div>

                  {overrideId === null && result ? (
                    <div className="mt-7 rounded-3xl border border-ink/10 bg-blush/30 p-5">
                      <p className="text-[11px] font-semibold uppercase tracking-editorial text-ink-muted">Why this suggestion</p>
                      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                        {result.reasons.map((reason: string) => (
                          <li key={reason} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-deep" aria-hidden="true" />
                            {reason}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link to={`/book?service=${selectedService.id}`} className="btn-primary">
                      Book this service <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <button type="button" className="btn-outline" onClick={focusOverride}>Choose another</button>
                  </div>

                  <div className="mt-9 border-t border-ink/10 pt-6">
                    <label className="field-label" htmlFor="service-override">Override the suggestion</label>
                    <select
                      ref={overrideRef}
                      id="service-override"
                      className="field"
                      value={overrideId ?? result?.serviceId ?? ''}
                      onChange={(event) => setOverrideId(Number(event.target.value))}
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-ink-faint">Your choice always wins — this is guidance, not a rule.</p>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="overflow-hidden rounded-4xl border border-ink/10 bg-ivory">
            <div className="aspect-[4/3] bg-sand/25">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=900&q=85"
                alt="Soft lash styling sample photograph"
                className="h-full w-full"
              />
            </div>
            <div className="p-6">
              <p className="eyebrow mb-4">Good to know</p>
              <ul className="space-y-3 text-sm leading-relaxed text-ink-muted">
                <li>The suggestion uses simple rules, not external AI.</li>
                <li>It is not professional advice and does not assess lash health.</li>
                <li>All prices and durations are demonstration values.</li>
                <li>You can continue to booking from any suggestion or override.</li>
              </ul>
            </div>
          </div>
          <Alert variant="info" title="Demo suggestion only">
            This experience shows a guided choice journey. Mina should confirm any real service
            recommendation with the client.
          </Alert>
          <div className="flex items-center gap-3 text-xs text-ink-faint">
            <Sparkles size={16} aria-hidden="true" />
            <p>{result?.disclaimer ?? 'Answer the four questions to see an explanation.'}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
