import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import DemoBadge from '../components/DemoBadge';
import { useServices } from '../hooks/useServices';
import { recommend } from '../services/recommendation';
import type { FinishAnswer, LookAnswer, RecommendationAnswers, VisitAnswer } from '../services/recommendation';
import { formatDuration, formatPrice } from '../services/format';

type AnswerKey = keyof RecommendationAnswers;

const QUESTIONS: Array<{ key: AnswerKey; question: string; hint: string }> = [
  { key: 'look', question: 'What look do you prefer?', hint: 'Choose the mood that feels most like you.' },
  { key: 'firstVisit', question: 'Is this your first lash appointment?', hint: 'We tailor the sample suggestion either way.' },
  { key: 'finish', question: 'Natural or dramatic?', hint: 'Think about your everyday finish.' },
  { key: 'visit', question: 'Full set or maintenance?', hint: 'Not sure yet? That is a valid answer.' },
];

function isComplete(value: Partial<RecommendationAnswers>): value is RecommendationAnswers {
  return (
    value.look !== undefined &&
    value.firstVisit !== undefined &&
    value.finish !== undefined &&
    value.visit !== undefined
  );
}

function OptionButton({ label, hint, selected, onClick }: {
  label: string;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
        selected ? 'border-ink bg-accent/25' : 'border-ink/15 bg-white/60 hover:border-ink/50'
      }`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="font-semibold">{label}</span>
        <span className={`grid h-5 w-5 place-items-center rounded-full border ${selected ? 'border-ink bg-ink text-accent' : 'border-ink/25'}`}>
          {selected ? '✓' : ''}
        </span>
      </span>
      {hint ? <span className="mt-1 block text-xs text-ink/55">{hint}</span> : null}
    </button>
  );
}

export default function RecommendationPage() {
  const { services, loading, error } = useServices();
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Partial<RecommendationAnswers>>({});
  const [overrideId, setOverrideId] = useState<number | null>(null);

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
  );

  const reset = (): void => {
    setAnswers({});
    setOverrideId(null);
    setStep(0);
  };

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="eyebrow">Style finder</p>
            <DemoBadge />
          </div>
          <h1 className="text-5xl leading-tight sm:text-6xl">Find your lash language.</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink/60">
            Four quick questions produce an explainable suggestion from the sample menu.
            It works offline and you can always override it.
          </p>
        </div>
        <Sparkles size={38} strokeWidth={1.2} className="text-ink/30" />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-6 sm:p-9">
          {step < QUESTIONS.length ? (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-editorial text-ink/50">
                  Question {step + 1} of {QUESTIONS.length}
                </span>
                <div className="flex gap-1.5">
                  {QUESTIONS.map((question, index) => (
                    <span key={question.key} className={`h-1.5 w-8 rounded-full ${index <= step ? 'bg-accent' : 'bg-ink/10'}`} />
                  ))}
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl">{QUESTIONS[step].question}</h2>
              <p className="mt-2 text-sm text-ink/55">{QUESTIONS[step].hint}</p>

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
                    <OptionButton label="Natural finish" hint="Clean, understated." selected={answers.finish === 'natural'} onClick={() => choose('finish', 'natural' as FinishAnswer)} />
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
                <button type="button" className="mt-8 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/55 hover:text-ink" onClick={() => setStep((current: number) => current - 1)}>
                  <ArrowLeft size={15} /> Previous question
                </button>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="eyebrow">Your sample suggestion</p>
                <button type="button" className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-ink/55 hover:text-ink" onClick={reset}>
                  <RotateCcw size={14} /> Start over
                </button>
              </div>

              {loading ? <Spinner label="Matching the sample menu…" className="py-10" /> : null}
              {error ? <Alert variant="error" title="Menu unavailable">{error}</Alert> : null}

              {!loading && !error && selectedService ? (
                <>
                  <h2 className="text-4xl">{selectedService.name}</h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink/60">{selectedService.description}</p>
                  <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3 text-sm">
                    <span className="font-semibold">{formatPrice(selectedService.price_ghs)}</span>
                    <span className="text-ink/60">{formatDuration(selectedService.duration_minutes)}</span>
                    <span className="text-ink/60">{selectedService.category}</span>
                  </div>

                  {overrideId === null && result ? (
                    <div className="mt-7 rounded-2xl border border-ink/10 bg-white/60 p-5">
                      <p className="text-xs font-semibold uppercase tracking-editorial text-ink/50">Why this suggestion</p>
                      <ul className="mt-3 space-y-2 text-sm text-ink/70">
                        {result.reasons.map((reason: string) => (
                          <li key={reason} className="flex gap-2"><span className="text-accent">●</span>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <div className="mt-7 grid gap-4 sm:grid-cols-2">
                    <Link to={`/book?service=${selectedService.id}`} className="btn-accent">
                      Book this service <ArrowRight size={16} />
                    </Link>
                    <a href="#override" className="btn-outline">Choose another</a>
                  </div>

                  <div id="override" className="mt-8 border-t border-ink/10 pt-6">
                    <label className="field-label" htmlFor="service-override">Override the suggestion</label>
                    <select
                      id="service-override"
                      className="field"
                      value={overrideId ?? result?.serviceId ?? ''}
                      onChange={(event) => setOverrideId(Number(event.target.value))}
                    >
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>{service.name}</option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-ink/45">Your choice always wins — this is guidance, not a rule.</p>
                  </div>
                </>
              ) : null}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-3xl border border-ink/10 bg-white/50 p-6">
            <p className="eyebrow mb-4">Good to know</p>
            <ul className="space-y-4 text-sm leading-relaxed text-ink/65">
              <li>No external AI is used. Answers are matched to sample services with simple rules.</li>
              <li>The suggestion is not professional advice and does not assess lash health.</li>
              <li>All prices and durations are demonstration values pending Mina's confirmation.</li>
              <li>You can continue to booking from any suggestion or override.</li>
            </ul>
          </div>
          <Alert variant="info" title="Demo suggestion only">
            This experience exists to show a guided choice journey. Mina should confirm any real
            service recommendation with the client.
          </Alert>
        </aside>
      </div>
    </div>
  );
}
