import { useMemo, useState } from 'react';
import { MapPin, Phone, ShieldCheck, Clock, Send, Eye, MapPinOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { BLOOD_GROUPS, cleanTerm, errorKey, unwrap } from '../../lib/db';
import { roundOrigin } from '../../lib/geo';
import { useNearFilter } from '../../lib/useNearFilter';
import { useAsync, useDebounced } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import FilterChips from '../ui/FilterChips';
import SearchBar from '../ui/SearchBar';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Sheet from '../ui/Sheet';
import Textarea from '../ui/Textarea';
import ReportButton from '../report/ReportButton';
import NearFilters from '../geo/NearFilters';
import DistanceBadge from '../geo/DistanceBadge';
import ViewToggle from '../geo/ViewToggle';
import MapView from '../geo/MapView';
import EmptyState from '../ui/EmptyState';
import { validateText } from '../../lib/validators';

function DonorCard({ d, numbers, revealing, onReveal, onContact }) {
  const { t, lang } = useLanguage();
  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-lg font-extrabold text-rose-600 dark:bg-rose-500/15 dark:text-rose-300">
          {d.blood_group}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900 dark:text-white">{d.first_name || '—'}</p>
          <p className="flex items-center gap-1 truncate text-sm text-slate-500 dark:text-slate-400">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {[d.city, d.district].filter(Boolean).join(', ')}
          </p>
        </div>
        <Badge tone={d.verification_status === 'verified' ? 'green' : 'slate'} icon={d.verification_status === 'verified' ? ShieldCheck : undefined}>
          {d.verification_status === 'verified' ? t('blood.verified') : d.verification_status === 'pending' ? t('blood.pending') : t('blood.unverified')}
        </Badge>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <DistanceBadge km={d.distance_km} />
        {d.last_donated_on && (
          <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {t('blood.lastDonated')}: {new Date(d.last_donated_on).toLocaleDateString(lang === 'ta' ? 'ta-IN' : 'en-IN')}
          </span>
        )}
      </div>

      <div className="-mb-1 flex justify-end">
        <ReportButton type="profile" id={d.user_id} />
      </div>

      {numbers[d.user_id] ? (
        <Button as="a" href={`tel:${numbers[d.user_id].replace(/[^0-9+]/g, '')}`} fullWidth icon={Phone}>
          {t('blood.callDonor')}: {numbers[d.user_id]}
        </Button>
      ) : d.contact_status === 'accepted' ? (
        <Button fullWidth variant="secondary" icon={Eye} loading={revealing === d.user_id} onClick={() => onReveal(d)}>
          {t('blood.showNumber')}
        </Button>
      ) : d.contact_status === 'pending' ? (
        <Button fullWidth variant="secondary" disabled>
          {t('blood.contactPending')}
        </Button>
      ) : d.contact_status === 'declined' ? (
        <Button fullWidth variant="secondary" disabled>
          {t('blood.contactDeclined')}
        </Button>
      ) : (
        <Button fullWidth icon={Send} onClick={() => onContact(d)}>
          {t('blood.requestContact')}
        </Button>
      )}
    </Card>
  );
}

export default function DonorSearch() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const near = useNearFilter();
  const { origin } = near;
  const [group, setGroup] = useState('');
  const [loc, setLoc] = useState('');
  const dLoc = useDebounced(loc, 400);
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [target, setTarget] = useState(null); // donor being contacted
  const [message, setMessage] = useState('');
  const [msgError, setMsgError] = useState('');
  const [busy, setBusy] = useState(false);
  const [numbers, setNumbers] = useState({}); // user_id -> phone (only after donor accepted)
  const [revealing, setRevealing] = useState(null);

  const sortNear = Boolean(origin && near.sortNearest);
  const radiusKm = origin && near.radius !== 'all' ? Number(near.radius) : null;

  const query = useAsync(
    async () =>
      unwrap(
        await supabase.rpc('search_blood_donors', {
          p_group: group || null,
          p_location: cleanTerm(dLoc) || null,
          p_lat: origin ? roundOrigin(origin.lat) : null,
          p_lon: origin ? roundOrigin(origin.lon) : null,
          p_radius_km: radiusKm,
          p_sort_nearest: sortNear,
        })
      ),
    [group, dLoc, origin?.lat, origin?.lon, radiusKm, sortNear]
  );

  const groupOptions = [{ value: '', label: t('common.all') }, ...BLOOD_GROUPS.map((g) => ({ value: g, label: g }))];

  const markers = useMemo(
    () =>
      (query.data || [])
        .filter((d) => typeof d.latitude === 'number' && typeof d.longitude === 'number')
        .map((d) => ({ id: d.user_id, lat: d.latitude, lon: d.longitude, label: d.blood_group, color: '#e11d48', title: `${d.blood_group} · ${d.first_name || ''}` })),
    [query.data]
  );
  const selected = (query.data || []).find((d) => d.user_id === selectedId) || null;
  const withoutLocation = (query.data || []).length - markers.length;

  async function sendRequest() {
    const err = validateText(message, { min: 5, max: 300 });
    setMsgError(err);
    if (err) return;
    setBusy(true);
    try {
      unwrap(
        await supabase.from('donor_contact_requests').insert({
          requester_id: user.id,
          donor_user_id: target.user_id,
          message: message.trim(),
        })
      );
      toast.success(t('blood.requestSent'));
      setTarget(null);
      setMessage('');
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  async function reveal(donor) {
    setRevealing(donor.user_id);
    try {
      const phone = unwrap(await supabase.rpc('get_donor_contact', { p_donor_user_id: donor.user_id }));
      if (phone) setNumbers((n) => ({ ...n, [donor.user_id]: phone }));
      else toast.error(t('blood.notShared'));
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setRevealing(null);
    }
  }

  const cardProps = { numbers, revealing, onReveal: reveal, onContact: (d) => { setTarget(d); setMsgError(''); } };

  return (
    <div className="space-y-4">
      <NearFilters near={near} />
      <FilterChips label={t('blood.group')} options={groupOptions} value={group} onChange={setGroup} />
      <SearchBar value={loc} onChange={setLoc} placeholder={t('common.location')} />
      <ViewToggle value={view} onChange={setView} />

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('blood.noDonors')} emptyText={t('blood.noDonorsHint')}>
        {(donors) =>
          view === 'list' ? (
            <div className="space-y-3">
              {donors.map((d) => (
                <DonorCard key={d.user_id} d={d} {...cardProps} />
              ))}
            </div>
          ) : markers.length ? (
            <div className="space-y-3">
              <MapView markers={markers} selectedId={selectedId} onSelect={setSelectedId} origin={origin} youLabel={t('map.you')} />
              {withoutLocation > 0 && (
                <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <MapPinOff className="h-3.5 w-3.5" />
                  {withoutLocation} {t('map.hidden')}
                </p>
              )}
              {selected ? <DonorCard d={selected} {...cardProps} /> : <p className="text-center text-sm text-slate-500 dark:text-slate-400">{t('map.tapPin')}</p>}
            </div>
          ) : (
            <EmptyState icon={MapPinOff} title={t('map.noPins')} text={t('map.noPinsHint')} />
          )
        }
      </QueryState>

      <Sheet open={Boolean(target)} onClose={() => setTarget(null)} title={t('blood.requestContact')}>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">{t('blood.contactSheetText')}</p>
        <Textarea
          label={t('blood.contactMessage')}
          value={message}
          maxLength={300}
          onChange={(e) => {
            setMessage(e.target.value);
            setMsgError('');
          }}
          error={msgError && t(msgError)}
        />
        <Button fullWidth className="mt-4" icon={Send} loading={busy} onClick={sendRequest}>
          {t('blood.sendRequest')}
        </Button>
      </Sheet>
    </div>
  );
}
