/**
 * Publicly published Mina Minks details, used for reference in this independent demo.
 *
 * Source: https://www.minaminks.com/ (checked 2026-11-27). These values are
 * displayed as published information only. They are NOT booking rules in this
 * demo: prices, durations, deposits and policies here do not change availability,
 * totals or confirmation behaviour. Anything not published on the public site
 * remains sample data pending Mina's approval.
 */

export interface PublicService {
  name: string;
  category: string;
  description: string;
  publishedPrice: string;
  publishedDuration: string;
}

export const publicBusiness = {
  name: 'Mina Minks',
  tagline: 'Elevate your beauty, one lash at a time. Lash extensions by Beryl Addo, tailored to you.',
  founder: 'Beryl Addo',
  location: 'Accra, Ghana',
  phoneLabel: '+233 50 529 8278',
  phoneHref: 'tel:+233505298278',
  email: 'minaminks01@gmail.com',
  sourceUrl: 'https://www.minaminks.com/',
  whatsappUrl: 'https://wa.me/233505298278',
  instagramUrl: 'https://www.instagram.com/mina.minkss/',
  snapchatUrl: 'https://t.snapchat.com/LNnlvajm',
  mapUrl: 'https://www.google.com/maps/search/?api=1&query=Mina+Minks+Studio',
} as const;

export const publicDisclaimer =
  'Published on minaminks.com for reference only. This independent demo uses separate sample data; no published price, duration or policy is enforced here.';

export const publicServices: readonly PublicService[] = [
  {
    name: 'Doll Classic',
    category: 'Classic (Natural Look)',
    description: 'Soft, even lash extensions. Perfect for clients who love a natural yet noticeable enhancement.',
    publishedPrice: 'GH₵ 250',
    publishedDuration: '1.3 hrs',
  },
  {
    name: 'MM Classic',
    category: 'Classic – Signature Mina Minks Set',
    description: 'A signature set tailored for clean, defined lashes that enhance your natural beauty. One extension per natural lash for a timeless everyday look.',
    publishedPrice: 'GH₵ 280',
    publishedDuration: '1.3 hrs',
  },
  {
    name: 'Wet Set',
    category: 'Hybrid-Classic (Textured Look)',
    description: 'Light, spiky lash technique that mimics the appearance of wet mascara. Great for clients who love a soft yet bold texture.',
    publishedPrice: 'GH₵ 370',
    publishedDuration: '2 hrs',
  },
  {
    name: 'Hybrid',
    category: 'Mix of Classic + Volume',
    description: 'A balanced blend of classic and volume lashes for a fuller finish. Ideal for clients seeking a step up from classics without full drama.',
    publishedPrice: 'GH₵ 350',
    publishedDuration: '1.45 hrs',
  },
  {
    name: 'Volume',
    category: 'Volume (Full & Fluffy)',
    description: 'Lightweight handmade fans added to each lash for a soft, dense, and dramatic appearance. Great for lash lovers who love fullness.',
    publishedPrice: 'GH₵ 450',
    publishedDuration: '2 hrs',
  },
  {
    name: 'Mega Volume',
    category: 'Volume – Ultra Dense & Dark',
    description: 'Super full, dark, and fluffy set created with ultra-fine fans for maximum drama and intensity. Ideal for glam lovers.',
    publishedPrice: 'GH₵ 550',
    publishedDuration: '2.3 hrs',
  },
  {
    name: 'Classic Refill',
    category: 'Classic',
    description: 'Refresh your existing classic set by filling in grown-out or missing lashes to restore fullness.',
    publishedPrice: 'GH₵ 180',
    publishedDuration: '1.15 hrs',
  },
  {
    name: 'MM Classic Refill',
    category: 'Classic',
    description: 'Maintenance refill for Mina Minks signature classic set — keeps lashes fresh and clean.',
    publishedPrice: 'GH₵ 200',
    publishedDuration: '1.15 hrs',
  },
];
