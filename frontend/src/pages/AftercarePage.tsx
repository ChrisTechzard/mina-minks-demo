import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, RotateCcw, ShieldCheck } from 'lucide-react';
import Alert from '../components/Alert';
import DemoBadge from '../components/DemoBadge';
import Spinner from '../components/Spinner';
import ImageWithFallback from '../components/ImageWithFallback';
import PageIntro from '../components/ui/PageIntro';
import { api } from '../services/api';
import type { AftercareContent } from '../types';

export default function AftercarePage() {
  const [content, setContent] = useState<AftercareContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const load = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.getAftercare();
      if (mountedRef.current) setContent(result);
    } catch (caught: unknown) {
      if (mountedRef.current) {
        setError(caught instanceof Error ? caught.message : 'Aftercare content is unavailable.');
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="page-shell py-14 sm:py-20">
      <PageIntro
        eyebrow="Aftercare"
        title="Care for the look."
        description="Guidance below is sample content pending Mina's approval. It is not professional, medical or safety advice — always follow the instructions given at your appointment."
        aside={<DemoBadge />}
      />

      <div className="mt-10 grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="overflow-hidden rounded-5xl border border-ink/10 bg-sand/25">
            <div className="aspect-[4/5]">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=85"
                alt="Calm beauty treatment sample photograph"
                className="h-full w-full"
              />
            </div>
          </div>
          <div className="mt-5 flex gap-3 rounded-3xl border border-ink/10 bg-ivory p-5">
            <ShieldCheck size={20} className="mt-0.5 shrink-0 text-ink-soft" aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink-muted">
              These notes are demonstration content only. Confirm all aftercare advice with Mina
              before publishing it as business guidance.
            </p>
          </div>
        </aside>

        <div>
          {loading ? <Spinner label="Loading sample guidance…" className="py-16" /> : null}
          {error ? (
            <div className="space-y-4">
              <Alert variant="error" title="Aftercare unavailable">{error}</Alert>
              <button type="button" className="btn-outline" onClick={() => void load()}>Try again</button>
            </div>
          ) : null}
          {content ? (
            <>
              <div className="inline-flex rounded-full border border-ink/15 bg-blush/40 px-4 py-2 text-[11px] font-semibold uppercase tracking-editorial text-ink-soft">
                {content.label}
              </div>
              <Alert variant="info" title="Important" className="mt-5">{content.disclaimer}</Alert>
              <div className="mt-8 space-y-4">
                {content.sections.map((section, index) => (
                  <section key={section.title} className="surface p-6 sm:p-8">
                    <div className="flex items-start gap-4">
                      <span className="font-mono text-xs text-accent-deep">{String(index + 1).padStart(2, '0')}</span>
                      <div className="flex-1">
                        <h2 className="flex items-center gap-3 text-2xl leading-tight">
                          <Heart size={18} strokeWidth={1.5} aria-hidden="true" />
                          {section.title}
                        </h2>
                        <ul className="mt-5 space-y-3 text-sm leading-relaxed text-ink-muted">
                          {section.items.map((item: string) => (
                            <li key={item} className="flex gap-3">
                              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-deep" aria-hidden="true" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </section>
                ))}
              </div>
              <div className="mt-8 rounded-5xl bg-ink p-7 text-cream sm:p-9">
                <RotateCcw size={24} className="text-accent" aria-hidden="true" />
                <h2 className="mt-5 text-3xl">Time for a refill?</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/65">{content.rebooking_note}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link to="/lookup" className="btn-accent">Find a past booking <ArrowRight size={16} aria-hidden="true" /></Link>
                  <Link to="/book" className="btn-outline-light">Book again</Link>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
