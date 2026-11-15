import { useState } from 'react';
import { Building2, MapPin, Phone, Plus, Droplets } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BLOOD_GROUPS, cleanTerm, emptyToNull, errorKey, locationFilter, timeAgo, unwrap } from '../../lib/db';
import { useAsync, useDebounced } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import { hasErrors, validatePhone, validateText } from '../../lib/validators';
import FilterChips from '../ui/FilterChips';
import SearchBar from '../ui/SearchBar';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';
import Badge, { STATUS_TONE } from '../ui/Badge';
import Button from '../ui/Button';
import Sheet from '../ui/Sheet';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const BLANK = { blood_group: '', units: '1', hospital: '', city: '', district: '', urgency: 'normal', contact_phone: '', note: '' };

export default function BloodRequests() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [group, setGroup] = useState('');
  const [loc, setLoc] = useState('');
  const dLoc = useDebounced(loc, 400);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const query = useAsync(async () => {
    let q = supabase.from('blood_requests').select('*').order('created_at', { ascending: false }).limit(100);
    if (group) q = q.eq('blood_group', group);
    q = locationFilter(q, dLoc);
    return unwrap(await q);
  }, [group, dLoc]);

  const set = (f) => (e) => {
    setForm((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  function openForm() {
    setForm({ ...BLANK, city: profile?.city || '', district: profile?.district || '', contact_phone: profile?.phone || '', blood_group: profile?.blood_group || '' });
    setErrors({});
    setOpen(true);
  }

  async function submit() {
    const units = Number(form.units);
    const next = {
      blood_group: BLOOD_GROUPS.includes(form.blood_group) ? '' : 'err.selectOne',
      units: Number.isInteger(units) && units >= 1 && units <= 20 ? '' : 'err.invalidData',
      hospital: validateText(form.hospital, { min: 2, max: 120 }),
      city: validateText(form.city, { min: 2, max: 60 }),
      district: validateText(form.district, { max: 60, required: false }),
      contact_phone: validatePhone(form.contact_phone),
      note: validateText(form.note, { max: 500, required: false }),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('blood_requests').insert({
          requester_id: user.id,
          blood_group: form.blood_group,
          units,
          hospital: form.hospital.trim(),
          city: form.city.trim(),
          district: emptyToNull(form.district),
          urgency: form.urgency,
          contact_phone: form.contact_phone.trim(),
          note: emptyToNull(form.note),
        })
      );
      toast.success(t('common.posted'));
      setOpen(false);
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(id, status) {
    try {
      unwrap(await supabase.from('blood_requests').update({ status }).eq('id', id));
      toast.success(t('common.updated'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  const groupOptions = [{ value: '', label: t('common.all') }, ...BLOOD_GROUPS.map((g) => ({ value: g, label: g }))];

  return (
    <div className="space-y-4">
      <Button fullWidth icon={Plus} onClick={openForm}>
        {t('blood.req.new')}
      </Button>
      <FilterChips label={t('blood.group')} options={groupOptions} value={group} onChange={setGroup} />
      <SearchBar value={loc} onChange={setLoc} placeholder={t('common.location')} />

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('blood.req.empty')}>
        {(rows) => (
          <div className="space-y-3">
            {rows.map((r) => {
              const mine = r.requester_id === user.id;
              return (
                <Card key={r.id} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-600 text-lg font-extrabold text-white">
                      {r.blood_group}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {r.units} {t('blood.units')}
                      </p>
                      <p className="flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        {r.hospital}
                      </p>
                      <p className="flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {[r.city, r.district].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={STATUS_TONE[r.urgency]}>{t(`blood.urgency.${r.urgency}`)}</Badge>
                      {r.status !== 'open' && <Badge tone={STATUS_TONE[r.status]}>{t(`blood.status.${r.status}`)}</Badge>}
                    </div>
                  </div>
                  {r.note && <p className="text-sm text-slate-600 dark:text-slate-300">{r.note}</p>}
                  <p className="text-xs text-slate-400">{timeAgo(r.created_at, lang)}</p>

                  {r.status === 'open' && !mine && (
                    <Button as="a" href={`tel:${r.contact_phone.replace(/[^0-9+]/g, '')}`} fullWidth icon={Phone}>
                      {t('common.call')}: {r.contact_phone}
                    </Button>
                  )}
                  {mine && r.status === 'open' && (
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="secondary" onClick={() => setStatus(r.id, 'fulfilled')}>
                        {t('blood.req.fulfilled')}
                      </Button>
                      <Button variant="ghost" onClick={() => setStatus(r.id, 'closed')}>
                        {t('blood.req.closeIt')}
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </QueryState>

      <Sheet open={open} onClose={() => setOpen(false)} title={t('blood.req.new')}>
        <div className="space-y-4">
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
            <Input label={t('blood.req.units')} type="number" inputMode="numeric" min="1" max="20" value={form.units} onChange={set('units')} error={errors.units && t(errors.units)} />
            <Select
              label={t('blood.req.urgency')}
              placeholder=""
              options={['normal', 'urgent', 'critical'].map((u) => ({ value: u, label: t(`blood.urgency.${u}`) }))}
              value={form.urgency}
              onChange={set('urgency')}
            />
          </div>
          <Input label={t('blood.req.hospital')} icon={Building2} maxLength={120} value={form.hospital} onChange={set('hospital')} error={errors.hospital && t(errors.hospital)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('common.city')} maxLength={60} value={form.city} onChange={set('city')} error={errors.city && t(errors.city)} />
            <Input label={`${t('common.district')} (${t('common.optional')})`} maxLength={60} value={form.district} onChange={set('district')} error={errors.district && t(errors.district)} />
          </div>
          <Input label={t('blood.req.contact')} icon={Phone} type="tel" inputMode="tel" maxLength={15} value={form.contact_phone} onChange={set('contact_phone')} error={errors.contact_phone && t(errors.contact_phone)} />
          <Textarea label={t('blood.req.note')} rows={3} maxLength={500} value={form.note} onChange={set('note')} error={errors.note && t(errors.note)} />
          <Button fullWidth loading={busy} onClick={submit}>
            {t('common.post')}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
