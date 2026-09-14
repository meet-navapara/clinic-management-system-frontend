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
