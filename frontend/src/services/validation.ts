/** Shared client-side checks. The backend remains the source of truth. */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9()\s-]{7,20}$/;
const MIN_PHONE_DIGITS = 7;
const REFERENCE_PATTERN = /^MM-[0-9]{8}-[A-Z0-9]{6}$/;

export interface DetailsForm {
  full_name: string;
  email: string;
  phone: string;
  notes: string;
}

export type DetailsErrors = Partial<Record<keyof DetailsForm, string>>;

export interface LookupForm {
  reference: string;
  email: string;
  phone: string;
}

export type LookupErrors = Partial<Record<keyof LookupForm | 'contact', string>>;

export function validateBookingDetails(form: DetailsForm): DetailsErrors {
  const errors: DetailsErrors = {};
  if (form.full_name.trim().length < 2) errors.full_name = 'Please enter your full name.';
  if (!EMAIL_PATTERN.test(form.email.trim())) errors.email = 'Enter a valid email address.';

  const phone = form.phone.trim();
  const digitCount = phone.replace(/\D/g, '').length;
  if (!PHONE_PATTERN.test(phone) || digitCount < MIN_PHONE_DIGITS) {
    errors.phone = 'Enter a valid phone number with at least 7 digits.';
  }
  return errors;
}

export function validateLookup(form: LookupForm): LookupErrors {
  const errors: LookupErrors = {};
  const reference = form.reference.trim().toUpperCase();
  const email = form.email.trim().toLowerCase();
  const phone = form.phone.trim();

  if (!REFERENCE_PATTERN.test(reference)) {
    errors.reference = 'Use the format MM-YYYYMMDD-XXXXXX.';
  }
  if (!email && !phone) {
    errors.contact = 'Enter the email or phone number used when booking.';
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'Enter a valid email address.';
  }
  if (phone && (!PHONE_PATTERN.test(phone) || phone.replace(/\D/g, '').length < MIN_PHONE_DIGITS)) {
    errors.phone = 'Enter a valid phone number with at least 7 digits.';
  }
  return errors;
}
