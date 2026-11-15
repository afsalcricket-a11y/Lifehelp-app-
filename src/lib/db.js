import { supabase } from './supabase';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Throws the Supabase error so callers can handle it in one place.
export function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

// Keeps only letters (incl. Tamil marks), numbers, space and hyphen so the term is safe inside filters.
export function cleanTerm(value) {
  return String(value ?? '').replace(/[^\p{L}\p{M}\p{N} -]/gu, '').trim().slice(0, 40);
}

// Filter for "city OR district contains term" (term must already be cleaned).
export function locationFilter(query, term) {
  const t = cleanTerm(term);
  return t ? query.or(`city.ilike.%${t}%,district.ilike.%${t}%`) : query;
}

export function emptyToNull(value) {
  const v = String(value ?? '').replace(/\s+/g, ' ').trim();
  return v === '' ? null : v;
}

// Maps database/network errors to translation keys (never shows raw server text).
export function errorKey(err) {
  const code = err?.code;
  const msg = String(err?.message || '').toLowerCase();
  if (['42P01', 'PGRST205', 'PGRST202', '42883'].includes(code)) return 'err.setupNeeded';
  if (code === '42501' || msg.includes('row-level security') || msg.includes('permission denied')) return 'err.denied';
  if (code === '23505') return 'err.duplicate';
  if (['23514', '22001', '22P02', '23502', '22007'].includes(code)) return 'err.invalidData';
  if (msg.includes('fetch') || msg.includes('network')) return 'err.network';
  return 'err.generic';
}

// Loads safe public profile info (name, role, verified badge) for a list of user ids.
export async function fetchProfiles(ids) {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return {};
  const rows = unwrap(await supabase.from('public_profiles').select('*').in('id', unique));
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

export function timeAgo(iso, lang) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const abs = Math.abs(diff);
  if (abs > 30 * 86400) return new Date(iso).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN');
  const rtf = new Intl.RelativeTimeFormat(lang === 'ta' ? 'ta' : 'en', { numeric: 'auto' });
  if (abs >= 86400) return rtf.format(Math.round(diff / 86400), 'day');
  if (abs >= 3600) return rtf.format(Math.round(diff / 3600), 'hour');
  if (abs >= 60) return rtf.format(Math.round(diff / 60), 'minute');
  return rtf.format(Math.round(diff), 'second');
}

export function formatSalary(min, max, t) {
  const f = (n) => Number(n).toLocaleString('en-IN');
  if (min == null && max == null) return t('jobs.notDisclosed');
  if (min != null && max != null) return `₹${f(min)} – ₹${f(max)} ${t('jobs.perMonth')}`;
  return `₹${f(min ?? max)} ${t('jobs.perMonth')}`;
}

// Turns an "apply" string into a tappable link (email, web, or phone).
export function contactHref(value) {
  const v = String(value || '').trim();
  if (/^https?:\/\/\S+$/i.test(v)) return v;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return `mailto:${v}`;
  if (/^[0-9+() -]{7,15}$/.test(v)) return `tel:${v.replace(/[^0-9+]/g, '')}`;
  return null;
}
