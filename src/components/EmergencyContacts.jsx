import { useState } from 'react';
import { Phone, Plus, Trash2, UserRound } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyToNull, errorKey, unwrap } from '../lib/db';
import { useAsync } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { hasErrors, validatePhone, validateText } from '../lib/validators';
import Card from './ui/Card';
import Button from './ui/Button';
import Sheet from './ui/Sheet';
import Input from './ui/Input';
import QueryState from './ui/QueryState';

export default function EmergencyContacts() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', relationship: '', phone: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const query = useAsync(async () => unwrap(await supabase.from('emergency_contacts').select('*').eq('user_id', user.id).order('created_at', { ascending: true })), [user.id]);

  const set = (f) => (e) => {
    setForm((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  async function add() {
    const next = {
      name: validateText(form.name, { min: 2, max: 60 }),
      relationship: validateText(form.relationship, { max: 40, required: false }),
      phone: validatePhone(form.phone),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('emergency_contacts').insert({
          user_id: user.id,
          name: form.name.trim(),
          relationship: emptyToNull(form.relationship),
          phone: form.phone.trim(),
        })
      );
      toast.success(t('ec.added'));
      setOpen(false);
      setForm({ name: '', relationship: '', phone: '' });
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    if (!window.confirm(t('common.confirmDelete'))) return;
    try {
      unwrap(await supabase.from('emergency_contacts').delete().eq('id', id));
      toast.success(t('common.deleted'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('ec.title')}</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t('ec.subtitle')}</p>
        </div>
        <Button variant="secondary" icon={Plus} className="min-h-[40px] shrink-0 px-3.5 text-sm" onClick={() => { setErrors({}); setOpen(true); }}>
          {t('ec.add')}
        </Button>
      </div>

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('ec.empty')} emptyText="">
        {(rows) => (
          <div className="space-y-2.5">
            {rows.map((c) => (
              <Card key={c.id} className="flex items-center gap-3 !p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                  <UserRound className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-slate-900 dark:text-white">{c.name}</p>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">{[c.relationship, c.phone].filter(Boolean).join(' · ')}</p>
                </div>
                <a
                  href={`tel:${c.phone.replace(/[^0-9+]/g, '')}`}
                  aria-label={`${t('common.call')} ${c.name}`}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600 text-white"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <button onClick={() => remove(c.id)} aria-label={t('common.delete')} className="flex h-10 w-10 items-center justify-center rounded-full text-slate-400 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <Sheet open={open} onClose={() => setOpen(false)} title={t('ec.add')}>
        <div className="space-y-4">
          <Input label={t('ec.name')} maxLength={60} value={form.name} onChange={set('name')} error={errors.name && t(errors.name)} />
          <Input label={t('ec.relationship')} maxLength={40} value={form.relationship} onChange={set('relationship')} error={errors.relationship && t(errors.relationship)} />
          <Input label={t('common.phone')} type="tel" inputMode="tel" maxLength={15} value={form.phone} onChange={set('phone')} error={errors.phone && t(errors.phone)} />
          <Button fullWidth loading={busy} onClick={add}>
            {t('common.save')}
          </Button>
        </div>
      </Sheet>
    </section>
  );
}
