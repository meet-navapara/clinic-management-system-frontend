/**
 * Canonical mobile: exactly 10 digits (Indian mobile starting 6–9).
 * Accepts pasted forms with +91 / 0 prefix and returns digits only.
 */
export function normalizeIndianMobile(input) {
  if (input == null || String(input).trim() === '') return null;
  const digits = String(input).replace(/\D/g, '');
  if (!digits) return null;

  let ten = digits;
  if (digits.length === 12 && digits.startsWith('91')) ten = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) ten = digits.slice(1);
  else if (digits.length === 10) ten = digits;
  else return null;

  if (!/^[6-9]\d{9}$/.test(ten)) return null;
  return ten;
}

/**
 * Live phone input — digits only, max 10.
 * Strips +91 / 0 prefixes when pasting full numbers.
 */
export function formatIndianMobileInput(raw) {
  const str = String(raw ?? '');
  const withoutCountry = str
    .replace(/^\s*\+?\s*91[\s-]*/i, '')
    .replace(/^\s*0+/, '');
  let digits = withoutCountry.replace(/\D/g, '');

  if (digits.length >= 12 && digits.startsWith('91')) digits = digits.slice(2);
  return digits.slice(0, 10);
}

/** Digits-only string, optionally capped. */
export function digitsOnly(raw, maxLen) {
  const d = String(raw || '').replace(/\D/g, '');
  return maxLen ? d.slice(0, maxLen) : d;
}

export function isValidEmail(input) {
  if (!input) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input).trim());
}

export function ageFromDob(isoDate) {
  if (!isoDate) return null;
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime()) || d > new Date()) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age -= 1;
  if (age < 0 || age > 150) return null;
  return age;
}

export function validateLoginFields({ email, password }) {
  const errors = {};
  const trimmedEmail = String(email || '').trim();
  if (!trimmedEmail) errors.email = 'Email is required.';
  else if (!isValidEmail(trimmedEmail)) errors.email = 'Valid email is required.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export const STRONG_PASSWORD_MESSAGE =
  'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character.';

export function meetsPasswordComplexity(password) {
  const value = String(password || '');
  return /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value) && /[^A-Za-z0-9]/.test(value);
}
