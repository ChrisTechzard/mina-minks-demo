import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <div className="page-shell py-20 sm:py-28">
      <EmptyState
        className="mx-auto max-w-2xl"
        title="404 — this page wandered off."
        description="The link may be out of date. Head back to the homepage or compare the sample services."
        action={
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/" className="btn-primary">Home <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link to="/services" className="btn-outline">Sample services</Link>
          </div>
        }
      />
    </div>
  );
}
