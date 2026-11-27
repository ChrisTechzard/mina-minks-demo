import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Heart, RotateCcw } from 'lucide-react';
import Alert from '../components/Alert';
import DemoBadge from '../components/DemoBadge';
import Spinner from '../components/Spinner';
import ImageWithFallback from '../components/ImageWithFallback';
import { api } from '../services/api';
import type { AftercareContent } from '../types';

export default function AftercarePage() {
  const [content, setContent] = useState<AftercareContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api.getAftercare()
      .then((result: AftercareContent) => { if (active) setContent(result); })
      .catch((caught: unknown) => {
        if (active) setError(caught instanceof Error ? caught.message : 'Aftercare content is unavailable.');
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-14 lg:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="eyebrow">Aftercare</p>
            <DemoBadge />
          </div>
          <h1 className="text-5xl leading-tight sm:text-6xl">Care for the look.</h1>
          <p className="mt-5 text-sm leading-relaxed text-ink/60">
            Guidance below is sample content pending Mina's approval. It is not professional,
            medical or safety advice — always follow the instructions given at your appointment.
          </p>
          <div className="mt-8 aspect-[4/5] overflow-hidden rounded-3xl border border-ink/10">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=900&q=80"
              alt="Calm beauty treatment sample photograph"
              className="h-full w-full"
            />
          </div>
        </div>

        <div>
          {loading ? <Spinner label="Loading sample guidance…" className="py-16" /> : null}
          {error ? <Alert variant="error" title="Aftercare unavailable">{error}</Alert> : null}
          {content ? (
            <>
              <div className="rounded-2xl border border-ink/15 bg-accent/20 px-5 py-4 text-xs font-semibold uppercase tracking-editorial">
                {content.label}
              </div>
              <Alert variant="info" title="Important" className="mt-5">{content.disclaimer}</Alert>
              <div className="mt-8 space-y-5">
                {content.sections.map((section) => (
                  <section key={section.title} className="card p-6 sm:p-7">
                    <div className="flex items-center gap-3">
                      <Heart size={18} strokeWidth={1.5} />
                      <h2 className="text-2xl">{section.title}</h2>
                    </div>
                    <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink/65">
                      {section.items.map((item: string) => (
                        <li key={item} className="flex gap-3">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
              <div className="mt-8 rounded-3xl bg-ink p-7 text-cream sm:p-9">
                <RotateCcw size={24} className="text-accent" />
                <h2 className="mt-4 text-3xl">Time for a refill?</h2>
                <p className="mt-3 max-w-xl text-sm leading-relaxed text-cream/65">{content.rebooking_note}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/lookup" className="btn-accent">Find a past booking <ArrowRight size={16} /></Link>
                  <Link to="/book" className="inline-flex items-center rounded-full border border-cream/30 px-6 py-3 text-sm font-semibold hover:border-accent hover:text-accent">Book again</Link>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
