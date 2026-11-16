import { useEffect, useState } from 'react';
import { Gift, MapPin, Plus, Send, Check, X, Package, Ban } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { emptyToNull, errorKey, fetchProfiles, locationFilter, timeAgo, unwrap } from '../lib/db';
import { useAsync, useDebounced } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { hasErrors, validateText } from '../lib/validators';
import PageHeader from '../components/ui/PageHeader';
import Tabs from '../components/ui/Tabs';
import FilterChips from '../components/ui/FilterChips';
import SearchBar from '../components/ui/SearchBar';
import QueryState from '../components/ui/QueryState';
import Card from '../components/ui/Card';
import Badge, { STATUS_TONE } from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Sheet from '../components/ui/Sheet';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Textarea from '../components/ui/Textarea';
import Notice from '../components/ui/Notice';
import ReportButton from '../components/report/ReportButton';

const CATS = ['books', 'clothes', 'food', 'household', 'other'];
const CONDS = ['new', 'good', 'fair'];
const BLANK = { category: '', title: '', description: '', quantity: '1', condition: 'good', city: '', district: '' };

export default function Donations() {
  const { t } = useLanguage();
  const [tab, setTab] = useState('browse');
  return (
    <div className="space-y-5">
      <PageHeader title={t('don.title')} subtitle={t('don.subtitle')} icon={Gift} tile="bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400" />
      <Notice tone="warn">{t('don.safety')}</Notice>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { value: 'browse', label: t('don.tab.browse') },
          { value: 'mine', label: t('don.tab.mine') },
        ]}
      />
      {tab === 'browse' ? <Browse /> : <Mine />}
    </div>
  );
}

function ItemForm({ open, onClose, onDone }) {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ ...BLANK, city: profile?.city || '', district: profile?.district || '' });
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const set = (f) => (e) => {
    setForm((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  async function submit() {
    const qty = Number(form.quantity);
    const next = {
      category: CATS.includes(form.category) ? '' : 'err.selectOne',
      title: validateText(form.title, { min: 3, max: 100 }),
      description: validateText(form.description, { max: 500, required: false }),
      quantity: Number.isInteger(qty) && qty >= 1 && qty <= 1000 ? '' : 'err.invalidData',
      city: validateText(form.city, { min: 2, max: 60 }),
      district: validateText(form.district, { max: 60, required: false }),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('donation_items').insert({
          donor_id: user.id,
          category: form.category,
          title: form.title.trim(),
          description: emptyToNull(form.description),
          quantity: qty,
          condition: form.condition,
          city: form.city.trim(),
          district: emptyToNull(form.district),
        })
      );
      toast.success(t('common.posted'));
      onDone();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title={t('don.new')}>
      <div className="space-y-4">
        <Select label={t('common.category')} placeholder={t('err.selectOne')} options={CATS.map((c) => ({ value: c, label: t(`don.cat.${c}`) }))} value={form.category} onChange={set('category')} error={errors.category && t(errors.category)} />
        <Input label={t('common.title')} maxLength={100} value={form.title} onChange={set('title')} error={errors.title && t(errors.title)} />
        <Textarea label={`${t('common.description')} (${t('common.optional')})`} rows={3} maxLength={500} value={form.description} onChange={set('description')} error={errors.description && t(errors.description)} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('don.quantity')} type="number" inputMode="numeric" min="1" max="1000" value={form.quantity} onChange={set('quantity')} error={errors.quantity && t(errors.quantity)} />
          <Select label={t('don.condition')} placeholder="" options={CONDS.map((c) => ({ value: c, label: t(`don.cond.${c}`) }))} value={form.condition} onChange={set('condition')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('common.city')} maxLength={60} value={form.city} onChange={set('city')} error={errors.city && t(errors.city)} />
          <Input label={`${t('common.district')} (${t('common.optional')})`} maxLength={60} value={form.district} onChange={set('district')} error={errors.district && t(errors.district)} />
        </div>
        <Button fullWidth loading={busy} onClick={submit}>
          {t('common.post')}
        </Button>
      </div>
    </Sheet>
  );
}

function Browse() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [cat, setCat] = useState('');
  const [loc, setLoc] = useState('');
  const dLoc = useDebounced(loc, 400);
  const [formOpen, setFormOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [message, setMessage] = useState('');
  const [msgError, setMsgError] = useState('');
  const [busy, setBusy] = useState(false);

  const query = useAsync(async () => {
    let q = supabase.from('donation_items').select('*').eq('status', 'available').order('created_at', { ascending: false }).limit(100);
    if (cat) q = q.eq('category', cat);
    q = locationFilter(q, dLoc);
    const items = unwrap(await q);
    const mine = unwrap(await supabase.from('donation_requests').select('item_id,status').eq('requester_id', user.id));
    const people = await fetchProfiles(items.map((i) => i.donor_id));
    const reqMap = Object.fromEntries(mine.map((r) => [r.item_id, r.status]));
    return items.map((i) => ({ ...i, donor: people[i.donor_id], myRequest: reqMap[i.id] }));
  }, [cat, dLoc]);

  async function sendRequest() {
    const err = validateText(message, { min: 5, max: 300 });
    setMsgError(err);
    if (err) return;
    setBusy(true);
    try {
      unwrap(await supabase.from('donation_requests').insert({ item_id: target.id, requester_id: user.id, message: message.trim() }));
      toast.success(t('don.requestSent'));
      setTarget(null);
      setMessage('');
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  const catOptions = [{ value: '', label: t('common.all') }, ...CATS.map((c) => ({ value: c, label: t(`don.cat.${c}`) }))];

  return (
    <div className="space-y-4">
      <Button fullWidth icon={Plus} onClick={() => setFormOpen(true)}>
        {t('don.new')}
      </Button>
      <FilterChips label={t('common.category')} options={catOptions} value={cat} onChange={setCat} />
      <SearchBar value={loc} onChange={setLoc} placeholder={t('common.location')} />

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('don.empty')}>
        {(rows) => (
          <div className="space-y-3">
            {rows.map((i) => (
              <Card key={i.id} className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge tone="brand">{t(`don.cat.${i.category}`)}</Badge>
                  <Badge>{t(`don.cond.${i.condition}`)}</Badge>
                  <Badge>×{i.quantity}</Badge>
                </div>
                <p className="font-semibold text-slate-900 dark:text-white">{i.title}</p>
                {i.description && <p className="text-sm text-slate-600 dark:text-slate-300">{i.description}</p>}
                <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {[i.city, i.district].filter(Boolean).join(', ')} · {timeAgo(i.created_at, lang)}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('common.by')} {i.donor_id === user.id ? t('common.you') : i.donor?.full_name || '—'}
                  </p>
                  {i.donor_id !== user.id && <ReportButton type="donation" id={i.id} />}
                </div>
                {i.donor_id !== user.id &&
                  (i.myRequest ? (
                    <Button fullWidth variant="secondary" disabled>
                      {t('don.requested')} · {t(`don.${i.myRequest}`)}
                    </Button>
                  ) : (
                    <Button fullWidth icon={Send} onClick={() => { setTarget(i); setMsgError(''); }}>
                      {t('don.request')}
                    </Button>
                  ))}
              </Card>
            ))}
          </div>
        )}
      </QueryState>

      <ItemForm open={formOpen} onClose={() => setFormOpen(false)} onDone={() => { setFormOpen(false); query.reload(); }} />

      <Sheet open={Boolean(target)} onClose={() => setTarget(null)} title={target?.title || ''}>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t('don.requestHint')}</p>
        <Textarea
          label={t('common.message')}
          rows={4}
          maxLength={300}
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            setMsgError('');
          }}
          error={msgError && t(msgError)}
        />
        <Button fullWidth className="mt-4" icon={Send} loading={busy} onClick={sendRequest}>
          {t('don.request')}
        </Button>
      </Sheet>
    </div>
  );
}

function Mine() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [formOpen, setFormOpen] = useState(false);

  const query = useAsync(async () => {
    const items = unwrap(await supabase.from('donation_items').select('*').eq('donor_id', user.id).order('created_at', { ascending: false }));
    const ids = items.map((i) => i.id);
    const incoming = ids.length ? unwrap(await supabase.from('donation_requests').select('*').in('item_id', ids).order('created_at', { ascending: true })) : [];
    const sent = unwrap(await supabase.from('donation_requests').select('*, item:donation_items(title,status)').eq('requester_id', user.id).order('created_at', { ascending: false }));
    const people = await fetchProfiles(incoming.map((r) => r.requester_id));
    return {
      items: items.map((i) => ({ ...i, requests: incoming.filter((r) => r.item_id === i.id).map((r) => ({ ...r, requester: people[r.requester_id] })) })),
      sent,
    };
  }, [user.id]);

  async function run(fn, okMsg = 'common.updated') {
    try {
      await fn();
      toast.success(t(okMsg));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    }
  }

  const accept = (item, req) =>
    run(async () => {
      unwrap(await supabase.from('donation_requests').update({ status: 'accepted' }).eq('id', req.id));
      unwrap(await supabase.from('donation_items').update({ status: 'reserved' }).eq('id', item.id));
    });
  const decline = (req) => run(async () => unwrap(await supabase.from('donation_requests').update({ status: 'declined' }).eq('id', req.id)));
  const setItemStatus = (item, status) => run(async () => unwrap(await supabase.from('donation_items').update({ status }).eq('id', item.id)));

  return (
    <div className="space-y-6">
      <Button fullWidth icon={Plus} onClick={() => setFormOpen(true)}>
        {t('don.new')}
      </Button>

      <QueryState query={query} isEmpty={(d) => !d.items.length && !d.sent.length} emptyTitle={t('don.noMine')} emptyText="">
        {({ items, sent }) => (
          <>
            {items.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('don.incoming')}</h2>
                {items.map((i) => (
                  <Card key={i.id} className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">{i.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {t(`don.cat.${i.category}`)} · ×{i.quantity} · {timeAgo(i.created_at, lang)}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {i.is_hidden && <Badge tone="red">{t('mod.hidden')}</Badge>}
                        <Badge tone={STATUS_TONE[i.status]}>{t(`don.status.${i.status}`)}</Badge>
                      </div>
                    </div>

                    {i.requests.length === 0 ? (
                      <p className="text-sm text-slate-500 dark:text-slate-400">{t('don.noRequests')}</p>
                    ) : (
                      i.requests.map((r) => (
                        <div key={r.id} className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{r.requester?.full_name || '—'}</p>
                            <div className="flex shrink-0 items-center gap-1.5">
                              {r.requester?.ngo_verified && <Badge tone="green">{t('don.verifiedOrg')}</Badge>}
                              <ReportButton type="profile" id={r.requester_id} />
                              <Badge tone={STATUS_TONE[r.status]}>{t(`don.${r.status}`)}</Badge>
                            </div>
                          </div>
                          {r.requester?.ngo_name && <p className="text-xs text-slate-500 dark:text-slate-400">{r.requester.ngo_name}</p>}
                          {r.message && <p className="text-sm text-slate-600 dark:text-slate-300">{r.message}</p>}
                          {r.status === 'pending' && i.status === 'available' && (
                            <div className="grid grid-cols-2 gap-2">
                              <Button icon={Check} onClick={() => accept(i, r)}>
                                {t('don.accept')}
                              </Button>
                              <Button variant="secondary" icon={X} onClick={() => decline(r)}>
                                {t('don.decline')}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    <div className="grid gap-2">
                      {i.status === 'reserved' && (
                        <Button icon={Package} onClick={() => setItemStatus(i, 'donated')}>
                          {t('don.markDonated')}
                        </Button>
                      )}
                      {(i.status === 'available' || i.status === 'reserved') && (
                        <Button variant="ghost" icon={Ban} onClick={() => setItemStatus(i, 'withdrawn')}>
                          {t('don.withdraw')}
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </section>
            )}

            {sent.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{t('don.sent')}</h2>
                {sent.map((r) => (
                  <Card key={r.id} className="flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate font-medium text-slate-900 dark:text-white">{r.item?.title || '—'}</p>
                    <Badge tone={STATUS_TONE[r.status]}>{t(`don.${r.status}`)}</Badge>
                  </Card>
                ))}
              </section>
            )}
          </>
        )}
      </QueryState>

      <ItemForm open={formOpen} onClose={() => setFormOpen(false)} onDone={() => { setFormOpen(false); query.reload(); }} />
    </div>
  );
}
