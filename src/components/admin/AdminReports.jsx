import { useState } from 'react';
import { Ban, Check, CheckCircle2, EyeOff, Eye, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { errorKey, timeAgo, unwrap } from '../../lib/db';
import { useAsync } from '../../lib/useAsync';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useToast } from '../../context/ToastContext';
import FilterChips from '../ui/FilterChips';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Sheet from '../ui/Sheet';
import Textarea from '../ui/Textarea';
import SuspendSheet from './SuspendSheet';
import { emptyToNull } from '../../lib/db';

// How each reportable thing is read and shown to admins (admins can read all of these tables).
const TARGETS = {
  help_request: { table: 'help_requests', cols: 'id,title,description,user_id,is_hidden', owner: 'user_id', title: (r) => r.title, body: (r) => r.description },
  job: { table: 'jobs', cols: 'id,title,company,description,posted_by,is_hidden', owner: 'posted_by', title: (r) => `${r.title} · ${r.company}`, body: (r) => r.description },
  education: { table: 'education_resources', cols: 'id,title,description,url,posted_by,is_hidden', owner: 'posted_by', title: (r) => r.title, body: (r) => [r.description, r.url].filter(Boolean).join('\n') },
  donation: { table: 'donation_items', cols: 'id,title,description,donor_id,is_hidden', owner: 'donor_id', title: (r) => r.title, body: (r) => r.description },
  blood_request: { table: 'blood_requests', cols: 'id,blood_group,units,hospital,note,requester_id,is_hidden', owner: 'requester_id', title: (r) => `${r.blood_group} · ${r.hospital}`, body: (r) => r.note },
  profile: { table: 'profiles', cols: 'id,full_name,role,city,ngo_name', owner: 'id', title: (r) => r.full_name || '—', body: (r) => [r.ngo_name, r.city].filter(Boolean).join(' · ') },
};

export default function AdminReports() {
  const { t, lang } = useLanguage();
  const { user: me } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('open');
  const [closing, setClosing] = useState(null); // { report, status }
  const [note, setNote] = useState('');
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [busy, setBusy] = useState(false);

  const query = useAsync(async () => {
    const reports = unwrap(await supabase.from('reports').select('*').eq('status', status).order('created_at', { ascending: false }).limit(50));

    // load every reported item, one query per type
    const byType = {};
    reports.forEach((r) => (byType[r.target_type] ||= new Set()).add(r.target_id));
    const targets = {};
    await Promise.all(
      Object.entries(byType).map(async ([type, ids]) => {
        const cfg = TARGETS[type];
        const rows = unwrap(await supabase.from(cfg.table).select(cfg.cols).in('id', [...ids]));
        rows.forEach((row) => {
          targets[`${type}:${row.id}`] = { title: cfg.title(row), body: cfg.body(row), ownerId: row[cfg.owner], hidden: Boolean(row.is_hidden) };
        });
      })
    );

    // names + suspension state for reporters and owners
    const personIds = [...new Set([...reports.map((r) => r.reporter_id), ...Object.values(targets).map((x) => x.ownerId)].filter(Boolean))];
    const people = personIds.length ? unwrap(await supabase.from('profiles').select('id,full_name,is_suspended,is_admin').in('id', personIds)) : [];
    const pmap = Object.fromEntries(people.map((p) => [p.id, p]));

    return reports.map((r) => {
      const target = targets[`${r.target_type}:${r.target_id}`] || null;
      return { ...r, target, reporter: pmap[r.reporter_id], owner: target ? pmap[target.ownerId] : null };
    });
  }, [status]);

  async function run(fn) {
    setBusy(true);
    try {
      await fn();
      toast.success(t('common.updated'));
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  const moderate = (r, action) =>
    run(async () => unwrap(await supabase.rpc('admin_moderate_content', { p_type: r.target_type, p_id: r.target_id, p_action: action, p_note: null })));

  function remove(r) {
    if (!window.confirm(t('admin.rep.confirmRemove'))) return;
    moderate(r, 'remove');
  }

  const unsuspend = (u) => run(async () => unwrap(await supabase.rpc('admin_set_suspended', { p_user_id: u.id, p_suspended: false, p_reason: null })));

  async function closeReport() {
    setBusy(true);
    try {
      unwrap(await supabase.rpc('admin_resolve_report', { p_report_id: closing.report.id, p_status: closing.status, p_note: emptyToNull(note) }));
      toast.success(t('admin.rep.resolvedMsg'));
      setClosing(null);
      setNote('');
      query.reload();
    } catch (e) {
      toast.error(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  }

  const statusOptions = ['open', 'resolved', 'dismissed'].map((s) => ({ value: s, label: t(`admin.rep.${s}`) }));

  return (
    <div className="space-y-4">
      <FilterChips label={t('common.status')} options={statusOptions} value={status} onChange={setStatus} />

      <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('admin.rep.empty')} emptyText="">
        {(reports) => (
          <div className="space-y-3">
            {reports.map((r) => {
              const canSuspendOwner = r.owner && !r.owner.is_admin && r.owner.id !== me.id;
              return (
                <Card key={r.id} className="space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="red">{t(`report.reason.${r.reason}`)}</Badge>
                    <Badge>{t(`report.type.${r.target_type}`)}</Badge>
                    <span className="ml-auto text-xs text-slate-400">{timeAgo(r.created_at, lang)}</span>
                  </div>

                  {r.details && <p className="text-sm text-slate-700 dark:text-slate-200">“{r.details}”</p>}
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('admin.rep.by')}: {r.reporter?.full_name || '—'}
                  </p>

                  <div className="space-y-1.5 rounded-2xl bg-slate-50 p-3 dark:bg-slate-800">
                    {r.target ? (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-semibold text-slate-900 dark:text-white">{r.target.title}</p>
                          {r.target.hidden && <Badge tone="amber">{t('admin.rep.hidden')}</Badge>}
                        </div>
                        {r.target.body && <p className="line-clamp-4 whitespace-pre-wrap text-sm text-slate-600 dark:text-slate-300">{r.target.body}</p>}
                        {r.target_type !== 'profile' && (
                          <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            {t('admin.rep.owner')}: {r.owner?.full_name || '—'}
                            {r.owner?.is_suspended && <Badge tone="red">{t('admin.users.suspended')}</Badge>}
                          </p>
                        )}
                        {r.target_type === 'profile' && r.owner?.is_suspended && <Badge tone="red">{t('admin.users.suspended')}</Badge>}
                      </>
                    ) : (
                      <p className="text-sm italic text-slate-500 dark:text-slate-400">{t('admin.rep.gone')}</p>
                    )}
                  </div>

                  {r.status !== 'open' && r.resolution_note && <p className="text-xs text-slate-500 dark:text-slate-400">{r.resolution_note}</p>}

                  {r.status === 'open' && (
                    <div className="grid gap-2">
                      {r.target && r.target_type !== 'profile' && (
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" icon={r.target.hidden ? Eye : EyeOff} disabled={busy} onClick={() => moderate(r, r.target.hidden ? 'restore' : 'hide')}>
                            {r.target.hidden ? t('admin.rep.restore') : t('admin.rep.hide')}
                          </Button>
                          <Button variant="secondary" icon={Trash2} disabled={busy} onClick={() => remove(r)} className="text-red-600 dark:text-red-400">
                            {t('admin.rep.remove')}
                          </Button>
                        </div>
                      )}
                      {canSuspendOwner &&
                        (r.owner.is_suspended ? (
                          <Button variant="secondary" icon={CheckCircle2} disabled={busy} onClick={() => unsuspend(r.owner)}>
                            {t('admin.users.unsuspend')}
                          </Button>
                        ) : (
                          <Button variant="secondary" icon={Ban} disabled={busy} onClick={() => setSuspendTarget(r.owner)}>
                            {t('admin.users.suspend')}
                          </Button>
                        ))}
                      <div className="grid grid-cols-2 gap-2">
                        <Button icon={Check} onClick={() => setClosing({ report: r, status: 'resolved' })}>
                          {t('admin.rep.resolve')}
                        </Button>
                        <Button variant="ghost" icon={X} onClick={() => setClosing({ report: r, status: 'dismissed' })}>
                          {t('admin.rep.dismiss')}
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </QueryState>

      <Sheet open={Boolean(closing)} onClose={() => setClosing(null)} title={t('admin.rep.closeTitle')}>
        <div className="space-y-4">
          <Textarea label={t('admin.rep.note')} rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} />
          <Button fullWidth loading={busy} onClick={closeReport}>
            {t('admin.rep.confirm')}
          </Button>
        </div>
      </Sheet>

      <SuspendSheet
        user={suspendTarget}
        onClose={() => setSuspendTarget(null)}
        onDone={() => {
          setSuspendTarget(null);
          query.reload();
        }}
      />
    </div>
  );
}
