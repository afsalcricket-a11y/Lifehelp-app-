import { useState } from 'react';
import { Building2, Droplets, MapPin, Phone, ShieldCheck, ShieldOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { errorKey, unwrap } from '../../lib/db';
import { useAsync } from '../../lib/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import Tabs from '../ui/Tabs';
import FilterChips from '../ui/FilterChips';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';
import Badge, { STATUS_TONE } from '../ui/Badge';
import Button from '../ui/Button';
import Notice from '../ui/Notice';

const ORDER = { pending: 0, unverified: 1, verified: 2 };

export default function AdminVerification() {
  const { t } = useLanguage();
  const toast = useToast();
  const [kind, setKind] = useState('donors');
  const [status, setStatus] = useState('');
  const [busyId, setBusyId] = useState(null);

  const query = useAsync(async () => {
    if (kind === 'donors') {
      const rows = unwrap(
        await supabase.from('blood_donors').select('*, profile:profiles(full_name,is_suspended)').order('updated_at', { ascending: false }).limit(200)
      );
      return rows.map((r) => ({
        id: r.user_id,
        name: r.profile?.full_name || '—',
        place: [r.city, r.district].filter(Boolean).join(', '),
        phone: r.contact_phone,
        detail: r.blood_group,
        status: r.verification_status,
      }));
    }
    const rows = unwrap(await supabase.from('profiles').select('id,full_name,phone,city,district,ngo_name,ngo_verified').eq('role', 'ngo').order('created_at', { ascending: false }).limit(200));
    return rows.map((r) => ({
      id: r.id,
      name: r.full_name || '—',
      place: [r.city, r.district].filter(Boolean).join(', '),
      phone: r.phone,
      detail: r.ngo_name || null,
      status: r.ngo_verified ? 'verified' : r.ngo_name ? 'pending' : 'unverified',
    }));
  }, [kind]);

  async function setVerified(row, verified) {
    setBusyId(row.id);
    try {
      if (kind === 'donors') {
        unwrap(await supabase.rpc('admin_set_donor_verification', { p_user_id: row.id, p_status: verified ? 'verified' : 'unverified' }));
      } else {
        unwrap(await supabase.rpc('admin_set_ngo_verified', { p_user_id: row.id, p_verified: verified }));
      }
      toast.success(t('common.updated'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusyId(null);
    }
  }

  const statusOptions = [
    { value: '', label: t('common.all') },
    { value: 'pending', label: t('admin.ver.pending') },
    { value: 'unverified', label: t('admin.ver.unverified') },
    { value: 'verified', label: t('admin.ver.verified') },
  ];

  return (
    <div className="space-y-4">
      <Tabs
        value={kind}
        onChange={(k) => {
          setKind(k);
          setStatus('');
        }}
        tabs={[
          { value: 'donors', label: t('admin.ver.donors') },
          { value: 'orgs', label: t('admin.ver.orgs') },
        ]}
      />
      <FilterChips label={t('common.status')} options={statusOptions} value={status} onChange={setStatus} />
      <Notice>{t('admin.ver.hint')}</Notice>

      <QueryState query={query} isEmpty={(d) => !d.filter((r) => !status || r.status === status).length} emptyTitle={t('admin.ver.empty')} emptyText="">
        {(rows) => (
          <div className="space-y-3">
            {rows
              .filter((r) => !status || r.status === status)
              .sort((a, b) => ORDER[a.status] - ORDER[b.status])
              .map((r) => (
                <Card key={r.id} className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900 dark:text-white">{r.name}</p>
                      {r.detail ? (
                        <p className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
                          {kind === 'donors' ? <Droplets className="h-3.5 w-3.5 text-rose-500" /> : <Building2 className="h-3.5 w-3.5" />}
                          {r.detail}
                        </p>
                      ) : (
                        kind === 'orgs' && <p className="text-sm text-slate-400">{t('admin.ver.noOrgName')}</p>
                      )}
                    </div>
                    <Badge tone={STATUS_TONE[r.status]} icon={r.status === 'verified' ? ShieldCheck : undefined}>
                      {t(`admin.ver.${r.status}`)}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    {r.place && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        {r.place}
                      </span>
                    )}
                    {r.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5" />
                        {r.phone}
                      </span>
                    )}
                  </div>
                  {r.status === 'verified' ? (
                    <Button variant="secondary" fullWidth icon={ShieldOff} loading={busyId === r.id} onClick={() => setVerified(r, false)}>
                      {t('admin.ver.unverify')}
                    </Button>
                  ) : (
                    <Button fullWidth icon={ShieldCheck} loading={busyId === r.id} onClick={() => setVerified(r, true)}>
                      {t('admin.ver.verify')}
                    </Button>
                  )}
                </Card>
              ))}
          </div>
        )}
      </QueryState>
    </div>
  );
}
