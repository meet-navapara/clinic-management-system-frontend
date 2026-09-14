/**
 * Canonical Indian mobile: "+91 9876543210"
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
  return `+91 ${ten}`;
}

export function isValidEmail(input) {
  if (!input) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(input).trim());
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
