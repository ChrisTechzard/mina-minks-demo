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
    <article className="card group overflow-hidden">
      <div className={`relative overflow-hidden ${compact ? 'h-40' : 'h-56'}`}>
        <ImageWithFallback
          src={service.image_url}
          alt={`${service.name} sample imagery`}
          className="h-full w-full transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-4 top-4 rounded-full bg-cream/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-editorial">
          {service.category}
        </span>
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl leading-tight">{service.name}</h3>
        <p className="mt-3 text-sm leading-relaxed text-ink/65">{service.description}</p>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 pt-5">
          <div>
            <p className="font-display text-2xl">{formatPrice(service.price_ghs)}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/55">
              <Clock3 size={13} /> {formatDuration(service.duration_minutes)}
            </p>
          </div>
          <Link
            to={`/book?service=${service.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider underline decoration-ink/30 underline-offset-4 hover:decoration-ink"
          >
            Book <ArrowUpRight size={14} />
          </Link>
        </div>
        {compact ? <DemoBadge className="mt-4" /> : null}
      </div>
    </article>
  );
}
