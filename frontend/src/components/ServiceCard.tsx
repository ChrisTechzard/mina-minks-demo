import { Link } from 'react-router-dom';
import { ArrowUpRight, Clock3 } from 'lucide-react';
import type { Service } from '../types';
import { formatDuration, formatPrice } from '../services/format';
import ImageWithFallback from './ImageWithFallback';
import DemoBadge from './DemoBadge';

interface ServiceCardProps {
  service: Service;
  compact?: boolean;
}

export default function ServiceCard({ service, compact = false }: ServiceCardProps) {
  return (
    <article className="surface group flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-lift">
      <div className={`relative overflow-hidden border-b border-champagne/45 bg-sand/30 ${compact ? 'aspect-[4/3]' : 'aspect-[5/4]'}`}>
        <ImageWithFallback
          src={service.image_url}
          alt={`${service.name} sample imagery`}
          className="h-full w-full transition duration-700 group-hover:scale-[1.04]"
        />
        <span className="absolute left-4 top-4 rounded-full border border-champagne/70 bg-ivory/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-editorial text-ink-soft">
          {service.category}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6 sm:p-7">
        <h3 className="text-2xl leading-tight sm:text-[1.7rem]">{service.name}</h3>
        <p className="mt-3 flex-1 text-sm leading-relaxed text-ink-muted">{service.description}</p>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-champagne/45 pt-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-editorial text-ink-faint">Sample price</p>
            <p className="mt-1 font-display text-3xl leading-none text-accent-deep">{formatPrice(service.price_ghs)}</p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-muted">
              <Clock3 size={13} aria-hidden="true" /> {formatDuration(service.duration_minutes)}
            </p>
          </div>
          <Link to={`/book?service=${service.id}`} className="link-arrow">
            Book this service <ArrowUpRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {compact ? <DemoBadge className="mt-5 self-start" /> : null}
      </div>
    </article>
  );
}
