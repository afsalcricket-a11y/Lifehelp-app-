const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[0-9+() -]{7,15}$/;

export const ROLE_VALUES = ['student', 'jobseeker', 'donor', 'volunteer', 'ngo', 'public'];

export function cleanText(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

export function validateEmail(value) {
  const v = cleanText(value).toLowerCase();
  if (!v) return 'err.emailRequired';
  if (v.length > 254 || !EMAIL_RE.test(v)) return 'err.emailInvalid';
  return '';
}

export function validatePassword(value) {
  if (!value) return 'err.passwordRequired';
  if (value.length < 8) return 'err.passwordShort';
  if (value.length > 72) return 'err.passwordLong';
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return 'err.passwordWeak';
  return '';
}

export function validateName(value) {
  const v = cleanText(value);
  if (!v) return 'err.nameRequired';
  if (v.length < 2 || v.length > 60) return 'err.nameLength';
  return '';
}

export function validateRole(value) {
  return ROLE_VALUES.includes(value) ? '' : 'err.roleRequired';
}

// ---- Part 2 helpers ----
export function validatePhone(value, { required = true } = {}) {
  const v = cleanText(value);
  if (!v) return required ? 'err.phoneRequired' : '';
  return PHONE_RE.test(v) ? '' : 'err.phoneInvalid';
}

export function validateText(value, { min = 1, max = 100, required = true } = {}) {
  const v = cleanText(value);
  if (!v) return required ? 'err.required' : '';
  if (v.length < min) return 'err.tooShort';
  if (v.length > max) return 'err.tooLong';
  return '';
}

export function validateUrl(value) {
  const v = String(value ?? '').trim();
  if (!v) return 'err.required';
  if (v.length > 500 || /\s/.test(v)) return 'err.urlInvalid';
  try {
    const u = new URL(v);
    return u.protocol === 'http:' || u.protocol === 'https:' ? '' : 'err.urlInvalid';
  } catch {
    return 'err.urlInvalid';
  }
}

export function validateSalary(min, max) {
  const a = min === '' ? null : Number(min);
  const b = max === '' ? null : Number(max);
  if ((a !== null && (!Number.isInteger(a) || a < 0)) || (b !== null && (!Number.isInteger(b) || b < 0))) return 'err.salaryInvalid';
  if (a !== null && b !== null && b < a) return 'err.salaryRange';
  return '';
}

export const hasErrors = (errs) => Object.values(errs).some(Boolean);
