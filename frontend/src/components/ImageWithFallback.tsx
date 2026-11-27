import { useEffect, useState } from 'react';

interface ImageWithFallbackProps {
  src?: string | null;
  alt: string;
  className?: string;
  eager?: boolean;
}

export default function ImageWithFallback({ src, alt, className = '', eager = false }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const source = src && !failed ? src : '/lash-fallback.svg';
  return (
    <img
      src={source}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
