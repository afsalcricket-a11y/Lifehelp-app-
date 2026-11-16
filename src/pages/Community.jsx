import { useMemo, useState } from 'react';
import { HandHeart, MapPin, MapPinOff, Plus, Send, Check, Trash2, Ban, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cleanTerm, emptyToNull, errorKey, fetchProfiles, locationFilter, timeAgo, unwrap } from '../lib/db';
import { useAsync, useDebounced } from '../lib/useAsync';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { hasErrors, validateText } from '../lib/validators';
import PageHeader from '../components/ui/PageHeader';
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
import Spinner from '../components/ui/Spinner';
import ReportButton from '../components/report/ReportButton';
import EmptyState from '../components/ui/EmptyState';
import NearFilters from '../components/geo/NearFilters';
import DistanceBadge from '../components/geo/DistanceBadge';
import GpsButton from '../components/geo/GpsButton';
import ViewToggle from '../components/geo/ViewToggle';
import MapView from '../components/geo/MapView';
import { useNearFilter } from '../lib/useNearFilter';
import { applyNearFilter, hasCoords, roundCoord, withDistance } from '../lib/geo';

const CAT_ICON = { medical: '🏥', food: '🍲', education: '📚', shelter: '🏠', transport: '🚌', elderly: '🧓', other: '❓' };

const CATEGORIES = ['medical', 'food', 'education', 'shelter', 'transport', 'elderly', 'other'];
const STATUSES = ['open', 'in_progress', 'completed'];
const BLANK = { kind: 'request', category: '', title: '', description: '', city: '', district: '' };

export default function Community() {
  const { t, lang } = useLanguage();
  const { user, profile } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('open');
  const [mineOnly, setMineOnly] = useState(false);
  const [loc, setLoc] = useState('');
  const dLoc = useDebounced(loc, 400);
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(BLANK);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const near = useNearFilter();
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [postCoords, setPostCoords] = useState(null);

  const query = useAsync(async () => {
    let q = supabase.from('help_requests').select('*').order('created_at', { ascending: false }).limit(100);
    if (kind) q = q.eq('kind', kind);
    if (category) q = q.eq('category', category);
    if (status) q = q.eq('status', status);
    if (mineOnly) q = q.eq('user_id', user.id);
    q = locationFilter(q, dLoc);
    const rows = unwrap(await q);
    const people = await fetchProfiles(rows.map((r) => r.user_id));
    return rows.map((r) => ({ ...r, poster: people[r.user_id] }));
  }, [kind, category, status, mineOnly, dLoc]);

  // distance + "sort nearest" + radius, computed in the browser from approximate coordinates
  const items = useMemo(
    () => applyNearFilter(withDistance(query.data || [], near.origin), { origin: near.origin, sortNearest: near.sortNearest, radius: near.radius }),
    [query.data, near.origin, near.sortNearest, near.radius]
  );
  const markers = useMemo(
    () =>
      items.filter(hasCoords).map((r) => ({
        id: r.id,
        lat: r.latitude,
        lon: r.longitude,
        label: CAT_ICON[r.category] || '❓',
        color: r.kind === 'offer' ? '#059669' : '#2563eb',
        title: r.title,
      })),
    [items]
  );
  const selectedPost = items.find((r) => r.id === selectedId) || null;
  const withoutLocation = items.length - markers.length;

  const set = (f) => (e) => {
    setForm((x) => ({ ...x, [f]: e.target.value }));
    setErrors((x) => ({ ...x, [f]: '' }));
  };

  function openForm() {
    setPostCoords(null);
    setForm({ ...BLANK, city: profile?.city || '', district: profile?.district || '', kind: profile?.is_volunteer ? 'offer' : 'request' });
    setErrors({});
    setFormOpen(true);
  }

  async function submit() {
    const next = {
      category: CATEGORIES.includes(form.category) ? '' : 'err.selectOne',
      title: validateText(form.title, { min: 3, max: 100 }),
      description: validateText(form.description, { min: 10, max: 1000 }),
      city: validateText(form.city, { min: 2, max: 60 }),
      district: validateText(form.district, { max: 60, required: false }),
    };
    setErrors(next);
    if (hasErrors(next)) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('help_requests').insert({
          user_id: user.id,
          kind: form.kind,
          category: form.category,
          title: form.title.trim(),
          description: form.description.trim(),
          city: form.city.trim(),
          district: emptyToNull(form.district),
          ...(postCoords ? { latitude: roundCoord(postCoords.lat), longitude: roundCoord(postCoords.lon) } : {}),
        })
      );
      toast.success(t('common.posted'));
      setFormOpen(false);
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  const kindOptions = [
    { value: '', label: t('common.all') },
    { value: 'request', label: t('community.kind.request') },
    { value: 'offer', label: t('community.kind.offer') },
  ];
  const catOptions = [{ value: '', label: t('common.all') }, ...CATEGORIES.map((c) => ({ value: c, label: t(`cat.${c}`) }))];
  const statusOptions = [{ value: '', label: t('common.all') }, ...STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))];

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('community.title')}
        subtitle={t('community.subtitle')}
        icon={HandHeart}
        tile="bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
      />
      <Button fullWidth icon={Plus} onClick={openForm}>
        {t('community.new')}
      </Button>

      <div className="space-y-2.5">
        <FilterChips label={t('community.kind')} options={kindOptions} value={kind} onChange={setKind} />
        <FilterChips label={t('common.category')} options={catOptions} value={category} onChange={setCategory} />
        <FilterChips label={t('common.status')} options={statusOptions} value={status} onChange={setStatus} />
        <div className="flex gap-2">
          <SearchBar className="flex-1" value={loc} onChange={setLoc} placeholder={t('common.location')} />
          <button
            onClick={() => setMineOnly((m) => !m)}
            aria-pressed={mineOnly}
            className={`shrink-0 rounded-2xl border px-3.5 text-sm font-semibold transition ${
              mineOnly ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-200 bg-white text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            {t('common.mine')}
          </button>
        </div>
      </div>

      <NearFilters near={near} />
      <ViewToggle value={view} onChange={setView} />

      <QueryState query={query} isEmpty={() => !items.length}>
        {() =>
          view === 'list' ? (
            <div className="space-y-3">
              {items.map((r) => (
                <PostCard key={r.id} r={r} onOpen={() => setSelected(r)} />
              ))}
            </div>
          ) : markers.length ? (
            <div className="space-y-3">
              <MapView markers={markers} selectedId={selectedId} onSelect={setSelectedId} origin={near.origin} youLabel={t('map.you')} />
              {withoutLocation > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPinOff className="h-3.5 w-3.5" />
                  {withoutLocation} {t('map.hidden')}
                </p>
              )}
              {selectedPost ? <PostCard r={selectedPost} onOpen={() => setSelected(selectedPost)} /> : <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t('map.tapPin')}</p>}
            </div>
          ) : (
            <EmptyState icon={MapPinOff} title={t('map.noPins')} text={t('map.noPinsHint')} />
          )
        }
      </QueryState>

      <Sheet open={formOpen} onClose={() => setFormOpen(false)} title={t('community.new')}>
        <div className="space-y-4">
          <Select
            label={t('community.kind')}
            placeholder=""
            options={[
              { value: 'request', label: t('community.kind.request') },
              { value: 'offer', label: t('community.kind.offer') },
            ]}
            value={form.kind}
            onChange={set('kind')}
          />
          <Select
            label={t('common.category')}
            placeholder={t('err.selectOne')}
            options={CATEGORIES.map((c) => ({ value: c, label: t(`cat.${c}`) }))}
            value={form.category}
            onChange={set('category')}
            error={errors.category && t(errors.category)}
          />
          <Input label={t('community.titleLabel')} maxLength={100} value={form.title} onChange={set('title')} error={errors.title && t(errors.title)} />
          <Textarea label={t('common.description')} maxLength={1000} value={form.description} onChange={set('description')} error={errors.description && t(errors.description)} />
          <div className="grid grid-cols-2 gap-3">
            <Input label={t('common.city')} maxLength={60} value={form.city} onChange={set('city')} error={errors.city && t(errors.city)} />
            <Input label={`${t('common.district')} (${t('common.optional')})`} maxLength={60} value={form.district} onChange={set('district')} error={errors.district && t(errors.district)} />
          </div>
          <GpsButton done={Boolean(postCoords)} label={t('geo.attachPost')} onFix={setPostCoords} />
          <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            {t('geo.noGpsFallback')} {t('geo.privacy')}
          </p>
          <Button fullWidth loading={busy} onClick={submit}>
            {t('common.post')}
          </Button>
        </div>
      </Sheet>

      <RequestDetail
        request={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          query.reload();
        }}
      />
    </div>
  );
}

function RequestDetail({ request, onClose, onChanged }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [message, setMessage] = useState('');
  const [msgError, setMsgError] = useState('');
  const [busy, setBusy] = useState(false);
  const mine = request?.user_id === user.id;

  // Owner sees all responses; others only see whether they already responded.
  const responses = useAsync(async () => {
    if (!request) return [];
    const rows = unwrap(await supabase.from('help_responses').select('*').eq('request_id', request.id).order('created_at', { ascending: true }));
    const people = await fetchProfiles(rows.map((r) => r.responder_id));
    return rows.map((r) => ({ ...r, responder: people[r.responder_id] }));
  }, [request?.id]);

  const myResponse = (responses.data || []).find((r) => r.responder_id === user.id);

  async function respond() {
    const err = validateText(message, { min: 2, max: 300 });
    setMsgError(err);
    if (err) return;
    setBusy(true);
    try {
      unwrap(await supabase.from('help_responses').insert({ request_id: request.id, responder_id: user.id, message: message.trim() }));
      toast.success(t('community.responseSent'));
      setMessage('');
      responses.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function update(patch) {
    setBusy(true);
    try {
      unwrap(await supabase.from('help_requests').update(patch).eq('id', request.id));
      toast.success(t('common.updated'));
      onChanged();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(t('common.confirmDelete'))) return;
    setBusy(true);
    try {
      unwrap(await supabase.from('help_requests').delete().eq('id', request.id));
      toast.success(t('common.deleted'));
      onChanged();
    } catch (e) {
      toast.error(t(errorKey(e)));
      setBusy(false);
    }
  }

  if (!request) return null;
  const r = request;

  return (
    <Sheet open onClose={onClose} title={r.title}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={r.kind === 'offer' ? 'brand' : 'blue'}>{t(`community.kind.${r.kind}`)}</Badge>
          <Badge>{t(`cat.${r.category}`)}</Badge>
          <Badge tone={STATUS_TONE[r.status]}>{t(`status.${r.status}`)}</Badge>
          {r.is_hidden && <Badge tone="red">{t('mod.hidden')}</Badge>}
        </div>
        <p className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">{r.description}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('common.by')} {mine ? t('common.you') : r.poster?.full_name || '—'}
          {r.poster?.ngo_verified ? ' ✔' : ''} · {[r.city, r.district].filter(Boolean).join(', ')} · {timeAgo(r.created_at, lang)}
        </p>

        {!mine && <ReportButton type="help_request" id={r.id} />}

        {!mine && r.accepted_by === user.id && <Notice>{t('community.youAccepted')}</Notice>}

        {/* Responder view */}
        {!mine && r.status === 'open' && (
          <div className="space-y-3">
            {responses.loading && !responses.data ? (
              <div className="flex justify-center py-4 text-brand-600"><Spinner /></div>
            ) : myResponse ? (
              <Notice>{t('community.responded')}</Notice>
            ) : (
              <>
                <Textarea
                  label={t('community.yourMessage')}
                  rows={3}
                  maxLength={300}
                  value={message}
                  hint={t('community.shareContact')}
                  onChange={(e) => {
                    setMessage(e.target.value);
                    setMsgError('');
                  }}
                  error={msgError && t(msgError)}
                />
                <Button fullWidth icon={Send} loading={busy} onClick={respond}>
                  {t('community.send')}
                </Button>
              </>
            )}
          </div>
        )}

        {/* Owner view */}
        {mine && (
          <div className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('community.responses')} ({(responses.data || []).length})
            </h3>
            {responses.loading && !responses.data ? (
              <div className="flex justify-center py-4 text-brand-600"><Spinner /></div>
            ) : !(responses.data || []).length ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('community.noResponses')}</p>
            ) : (
              responses.data.map((resp) => (
                <div key={resp.id} className="space-y-2 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {resp.responder?.full_name || '—'}
                      {resp.responder?.ngo_verified ? ' ✔' : ''}
                    </p>
                    <div className="flex shrink-0 items-center gap-1">
                      {r.accepted_by === resp.responder_id && <Badge tone="green" icon={UserCheck}>{t('community.acceptedHelper')}</Badge>}
                      <ReportButton type="profile" id={resp.responder_id} />
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{resp.message}</p>
                  {r.status === 'open' && (
                    <Button variant="secondary" icon={Check} loading={busy} onClick={() => update({ status: 'in_progress', accepted_by: resp.responder_id })}>
                      {t('community.acceptHelper')}
                    </Button>
                  )}
                </div>
              ))
            )}

            <div className="grid gap-2 pt-1">
              {r.status === 'in_progress' && (
                <Button icon={Check} loading={busy} onClick={() => update({ status: 'completed' })}>
                  {t('community.markCompleted')}
                </Button>
              )}
              {(r.status === 'open' || r.status === 'in_progress') && (
                <Button variant="secondary" icon={Ban} loading={busy} onClick={() => update({ status: 'cancelled' })}>
                  {t('community.cancelPost')}
                </Button>
              )}
              <Button variant="ghost" icon={Trash2} onClick={remove} className="text-red-600 dark:text-red-400">
                {t('common.delete')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Sheet>
  );
}

function PostCard({ r, onOpen }) {
  const { t, lang } = useLanguage();
  return (
    <Card as="button" onClick={onOpen} className="block w-full space-y-2 text-left transition active:scale-[0.99]">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge tone={r.kind === 'offer' ? 'brand' : 'blue'}>{t(`community.kind.${r.kind}`)}</Badge>
        <Badge>{t(`cat.${r.category}`)}</Badge>
        {r.is_hidden && <Badge tone="red">{t('mod.hidden')}</Badge>}
        <Badge tone={STATUS_TONE[r.status]} className="ml-auto">
          {t(`status.${r.status}`)}
        </Badge>
      </div>
      <p className="font-semibold text-slate-900 dark:text-white">{r.title}</p>
      <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">{r.description}</p>
      <div className="flex flex-wrap items-center gap-2">
        <DistanceBadge km={r.distanceKm} />
        <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="h-3.5 w-3.5" />
          {[r.city, r.district].filter(Boolean).join(', ')} · {timeAgo(r.created_at, lang)}
        </p>
      </div>
    </Card>
  );
}
