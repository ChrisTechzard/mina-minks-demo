import { describe, expect, it } from 'vitest';
import { validateBookingDetails, validateLookup } from './validation';

const validDetails = {
  full_name: 'Ama Mensah',
  email: 'ama@example.com',
  phone: '+233 24 123 4567',
  notes: '',
};

describe('validateBookingDetails', () => {
  it('accepts complete details', () => {
    expect(validateBookingDetails(validDetails)).toEqual({});
  });

  it('rejects phone numbers with too few digits', () => {
    const errors = validateBookingDetails({ ...validDetails, phone: '+123' });
    expect(errors.phone).toContain('at least 7 digits');
  });

  it('reports each invalid field', () => {
    const errors = validateBookingDetails({ full_name: 'A', email: 'nope', phone: 'abc', notes: '' });
    expect(Object.keys(errors).sort()).toEqual(['email', 'full_name', 'phone']);
  });
});

describe('validateLookup', () => {
  it('accepts a reference with either contact method', () => {
    const base = { reference: 'MM-20261127-ABC123', email: '', phone: '' };
    expect(validateLookup({ ...base, email: 'ama@example.com' })).toEqual({});
    expect(validateLookup({ ...base, phone: '+233241234567' })).toEqual({});
  });

  it('requires a contact method and a valid reference', () => {
    const errors = validateLookup({ reference: 'bad', email: '', phone: '' });
    expect(errors.reference).toBeDefined();
    expect(errors.contact).toBeDefined();
  });
});
