import { describe, expect, it } from 'vitest';
import { recommend } from './recommendation';
import type { Service } from '../types';

const services: Service[] = [
  { id: 1, name: 'Classic Lash Extensions', description: '', price_ghs: 320, duration_minutes: 120, category: 'Full set', image_url: null, is_active: true, sort_order: 1 },
  { id: 2, name: 'Hybrid Lash Extensions', description: '', price_ghs: 380, duration_minutes: 150, category: 'Full set', image_url: null, is_active: true, sort_order: 2 },
  { id: 3, name: 'Volume Lash Extensions', description: '', price_ghs: 450, duration_minutes: 180, category: 'Full set', image_url: null, is_active: true, sort_order: 3 },
  { id: 4, name: 'Lash Refill', description: '', price_ghs: 200, duration_minutes: 90, category: 'Maintenance', image_url: null, is_active: true, sort_order: 4 },
  { id: 5, name: 'Lash Removal', description: '', price_ghs: 100, duration_minutes: 45, category: 'Maintenance', image_url: null, is_active: true, sort_order: 5 },
  { id: 6, name: 'Lash Consultation', description: '', price_ghs: 50, duration_minutes: 30, category: 'Consultation', image_url: null, is_active: true, sort_order: 6 },
];

describe('recommend', () => {
  it('suggests a refill for maintenance clients', () => {
    const result = recommend(
      { look: 'natural', firstVisit: false, finish: 'natural', visit: 'maintenance' },
      services,
    );
    expect(result.serviceId).toBe(4);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it('suggests a consultation for unsure first-time clients', () => {
    const result = recommend(
      { look: 'soft', firstVisit: true, finish: 'natural', visit: 'unsure' },
      services,
    );
    expect(result.serviceId).toBe(6);
  });

  it('suggests volume for a dramatic full set', () => {
    const result = recommend(
      { look: 'glamour', firstVisit: false, finish: 'dramatic', visit: 'full' },
      services,
    );
    expect(result.serviceId).toBe(3);
  });

  it('ignores inactive services and warns it is not advice', () => {
    const inactive = services.map((service) => (service.id === 3 ? { ...service, is_active: false } : service));
    const result = recommend(
      { look: 'glamour', firstVisit: false, finish: 'dramatic', visit: 'full' },
      inactive,
    );
    expect(result.serviceId).not.toBe(3);
    expect(result.disclaimer).toContain('not professional advice');
  });
});
