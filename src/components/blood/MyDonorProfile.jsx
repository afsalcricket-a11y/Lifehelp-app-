import { useEffect, useState } from 'react';
import { Check, Droplets, Phone, ShieldCheck, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BLOOD_GROUPS, emptyToNull, errorKey, fetchProfiles, timeAgo, unwrap } from '../../lib/db';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { hasErrors, validatePhone, validateText } from '../../lib/validators';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';
import Badge, { STATUS_TONE } from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Notice from '../ui/Notice';

const today = () => new Date().toISOString().slice(0, 10);

export default function MyDonorProfile() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const toast = useToast();

  const donorQuery = useAsync(async () => unwrap(await supabase.from('blood_donors').select('*').eq('user_id', user.id).maybeSingle()) || false, [user.id]);
  const inboxQuery = useAsync(async () => {
    const rows = unwrap(await supabase.from('donor_contact_requests').select('*').eq('donor_user_id', user.id).order('created_at', { ascending: false }).limit(50));
    const people = await fetchProfiles(rows.map((r) => r.requester_id));
    return rows.map((r) => ({ ...r, requester: people[r.requester_id] }));
  }, [user.id]);

  const donor = donorQuery.data; // false when no donor row yet
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (donor === null) return;
    setForm({
      blood_group: donor?.blood_group || profile?.blood_group || '',
      city: donor?.city || profile?.city || '',
      district: donor?.district || profile?.district || '',
      contact_phone: donor?.contact_phone || profile?.phone || '',
      last_donated_on: donor?.last_donated_on || '',
      is_available: donor ? donor.is_available : true,
      consent: Boolean(donor?.consent_given),
    });
  }, [donor, profile]);

  const set = (f) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((x) => ({ ...x, [f]: v }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  async function save() {
    const next = {
      blood_group: BLOOD_GROUPS.includes(form.blood_group) ? '' : 'err.selectOne',
      city: validateText(form.city, { min: 2, max: 60 }),
      district: validateText(form.district, { max: 60, required: false }),
      contact_phone: validatePhone(form.contact_phone),
      last_donated_on: form.last_donated_on && form.last_donated_on > today() ? 'err.dateFuture' : '',
      consent: form.consent ? '' : 'err.consent',
    };
    setErrors(next);
    if (hasErrors(next)) return;
    const row = {
      blood_group: form.blood_group,
      city: form.city.trim(),
      district: emptyToNull(form.district),
      contact_phone: form.contact_phone.trim(),
      last_donated_on: form.last_donated_on || null,
      is_available: form.is_available,
    };
    setBusy(true);
    try {
      if (donor) unwrap(await supabase.from('blood_donors').update(row).eq('user_id', user.id));
      else unwrap(await supabase.from('blood_donors').insert({ ...row, user_id: user.id, consent_given: true }));
      toast.success(t('blood.donorSaved'));
      donorQuery.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function requestVerification() {
    try {
      unwrap(await supabase.rpc('request_donor_verification'));
      toast.success(t('blood.verificationRequested'));
      donorQuery.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  async function removeDonor() {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      unwrap(await supabase.from('blood_donors').delete().eq('user_id', user.id));
      toast.success(t('blood.donorRemoved'));
      donorQuery.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  async function answer(id, status) {
    try {
      unwrap(await supabase.from('donor_contact_requests').update({ status }).eq('id', id));
      toast.success(t('common.updated'));
      inboxQuery.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  return (
    <div className="space-y-6">
      <QueryState query={donorQuery} isEmpty={() => false}>
        {() =>
          form && (
            <Card className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{t('blood.register')}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('blood.registerHint')}</p>
              </div>

              {donor && (
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('blood.verification')}</span>
                  <Badge tone={STATUS_TONE[donor.verification_status]} icon={donor.verification_status === 'verified' ? ShieldCheck : undefined}>
                    {donor.verification_status === 'verified' ? t('blood.verified') : donor.verification_status === 'pending' ? t('blood.pending') : t('blood.unverified')}
                  </Badge>
                </div>
              )}
              {donor && <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">{t('blood.verificationHint')}</p>}
              {donor && donor.verification_status === 'unverified' && (
                <Button variant="secondary" fullWidth icon={ShieldCheck} onClick={requestVerification}>
                  {t('blood.requestVerification')}
                </Button>
              )}

              <Select
                label={t('blood.group')}
                icon={Droplets}
                placeholder={t('err.selectOne')}
                options={BLOOD_GROUPS.map((g) => ({ value: g, label: g }))}
                value={form.blood_group}
                onChange={set('blood_group')}
                error={errors.blood_group && t(errors.blood_group)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('common.city')} maxLength={60} value={form.city} onChange={set('city')} error={errors.city && t(errors.city)} />
                <Input label={`${t('common.district')} (${t('common.optional')})`} maxLength={60} value={form.district} onChange={set('district')} error={errors.district && t(errors.district)} />
              </div>
              <Input label={t('blood.contactPhone')} icon={Phone} type="tel" inputMode="tel" maxLength={15} value={form.contact_phone} onChange={set('contact_phone')} error={errors.contact_phone && t(errors.contact_phone)} />
              <Input label={`${t('blood.lastDonatedOn')} (${t('common.optional')})`} type="date" max={today()} value={form.last_donated_on} onChange={set('last_donated_on')} error={errors.last_donated_on && t(errors.last_donated_on)} />

              <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3.5 dark:border-slate-700">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{t('blood.available')}</span>
                <input type="checkbox" checked={form.is_available} onChange={set('is_available')} className="h-6 w-11 shrink-0 cursor-pointer accent-brand-600" />
              </label>

              {!donor && (
                <div>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input type="checkbox" checked={form.consent} onChange={set('consent')} className="mt-0.5 h-5 w-5 shrink-0 accent-brand-600" />
                    <span className="text-sm text-slate-600 dark:text-slate-300">{t('blood.consent')}</span>
                  </label>
                  {errors.consent && <p className="mt-1.5 text-xs font-medium text-red-600 dark:text-red-400">{t(errors.consent)}</p>}
                </div>
              )}

              <Button fullWidth loading={busy} onClick={save}>
                {t('blood.saveDonor')}
              </Button>
              {donor && (
                <Button fullWidth variant="ghost" icon={Trash2} onClick={removeDonor} className="text-red-600 dark:text-red-400">
                  {t('blood.removeDonor')}
                </Button>
              )}
            </Card>
          )
        }
      </QueryState>

      {donor && (
        <section className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('blood.inbox')}</h2>
          <QueryState query={inboxQuery} isEmpty={(d) => !d.length} emptyTitle={t('blood.inboxEmpty')} emptyText="">
            {(rows) => (
              <div className="space-y-3">
                {rows.map((r) => (
                  <Card key={r.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">{r.requester?.full_name || '—'}</p>
                        <p className="text-xs text-slate-400">{timeAgo(r.created_at, lang)}</p>
                      </div>
                      <Badge tone={STATUS_TONE[r.status]}>{r.status === 'accepted' ? t('blood.accepted') : r.status === 'declined' ? t('blood.contactDeclined') : t('don.pending')}</Badge>
                    </div>
                    {r.message && <p className="text-sm text-slate-600 dark:text-slate-300">{r.message}</p>}
                    {r.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button icon={Check} onClick={() => answer(r.id, 'accepted')}>
                          {t('blood.accept')}
                        </Button>
                        <Button variant="secondary" icon={X} onClick={() => answer(r.id, 'declined')}>
                          {t('blood.decline')}
                        </Button>
                      </div>
                    )}
                    {r.status === 'accepted' && (
                      <Button variant="secondary" fullWidth onClick={() => answer(r.id, 'declined')}>
                        {t('blood.revoke')}
                      </Button>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </QueryState>
        </section>
      )}
    </div>
  );
}
