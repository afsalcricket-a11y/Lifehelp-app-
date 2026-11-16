import { useState } from 'react';
import { Ban, CheckCircle2, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { cleanTerm, errorKey, timeAgo, unwrap } from '../../lib/db';
import { useAsync, useDebounced } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import SearchBar from '../ui/SearchBar';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import SuspendSheet from './SuspendSheet';

export default function AdminUsers() {
  const { t, lang } = useLanguage();
  const { user: me } = useAuth();
  const toast = useToast();
  const [text, setText] = useState('');
  const dText = useDebounced(text, 400);
  const [target, setTarget] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const query = useAsync(async () => {
    let q = supabase.from('profiles').select('id,full_name,role,city,district,is_admin,is_suspended,created_at').order('created_at', { ascending: false }).limit(50);
    const term = cleanTerm(dText);
    if (term) q = q.ilike('full_name', `%${term}%`);
    return unwrap(await q);
  }, [dText]);

  async function unsuspend(u) {
    setBusyId(u.id);
    try {
      unwrap(await supabase.rpc('admin_set_suspended', { p_user_id: u.id, p_suspended: false, p_reason: null }));
      toast.success(t('common.updated'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      <SearchBar value={text} onChange={setText} placeholder={t('admin.users.search')} />
      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('admin.users.empty')} emptyText="">
        {(rows) => (
          <div className="space-y-3">
            {rows.map((u) => (
              <Card key={u.id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{u.full_name || '—'}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {t(`role.${u.role}`)}
                      {(u.city || u.district) && (
                        <>
                          <span>·</span>
                          <MapPin className="h-3 w-3" />
                          {[u.city, u.district].filter(Boolean).join(', ')}
                        </>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {t('admin.users.joined')} {timeAgo(u.created_at, lang)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {u.is_admin && <Badge tone="brand">{t('admin.users.admin')}</Badge>}
                    {u.is_suspended && <Badge tone="red">{t('admin.users.suspended')}</Badge>}
                  </div>
                </div>
                {!u.is_admin && u.id !== me.id &&
                  (u.is_suspended ? (
                    <Button variant="secondary" fullWidth icon={CheckCircle2} loading={busyId === u.id} onClick={() => unsuspend(u)}>
                      {t('admin.users.unsuspend')}
                    </Button>
                  ) : (
                    <Button variant="secondary" fullWidth icon={Ban} onClick={() => setTarget(u)}>
                      {t('admin.users.suspend')}
                    </Button>
                  ))}
              </Card>
            ))}
          </div>
        )}
      </QueryState>
      <SuspendSheet
        user={target}
        onClose={() => setTarget(null)}
        onDone={() => {
          setTarget(null);
          query.reload();
        }}
      />
    </div>
  );
}
