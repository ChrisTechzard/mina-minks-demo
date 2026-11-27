import { describe, expect, it } from 'vitest';
import { businessDateFromIso } from './format';

describe('businessDateFromIso', () => {
  it('converts an ISO timestamp to the business calendar date', () => {
    expect(businessDateFromIso('2026-11-27T10:30:00.000Z')).toBe('2026-11-27');
  });

  it('returns an empty string for an invalid timestamp', () => {
    expect(businessDateFromIso('not-a-date')).toBe('');
  });
});
