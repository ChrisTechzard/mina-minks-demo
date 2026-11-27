import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-5 py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-6xl">This page wandered off.</h1>
      <p className="mt-5 max-w-lg text-sm leading-relaxed text-ink/60">
        The link may be out of date. Head back to the homepage or explore the sample services.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn-primary">Home <ArrowRight size={16} /></Link>
        <Link to="/services" className="btn-outline">Sample services</Link>
      </div>
    </div>
  );
}
