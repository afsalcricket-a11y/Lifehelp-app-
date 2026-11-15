const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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
