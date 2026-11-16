import { History } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { timeAgo, unwrap } from '../../lib/db';
import { useAsync } from '../../lib/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';

export default function AdminActivity() {
  const { t, lang } = useLanguage();
  const query = useAsync(async () => {
    const rows = unwrap(await supabase.from('admin_audit_log').select('*').order('created_at', { ascending: false }).limit(50));
    const ids = [...new Set(rows.map((r) => r.admin_id).filter(Boolean))];
    const people = ids.length ? unwrap(await supabase.from('profiles').select('id,full_name').in('id', ids)) : [];
    const map = Object.fromEntries(people.map((p) => [p.id, p.full_name]));
    return rows.map((r) => ({ ...r, adminName: map[r.admin_id] }));
  }, []);

  return (
    <QueryState query={query} isEmpty={(d) => !d.length} emptyTitle={t('admin.act.empty')} emptyText="">
      {(rows) => (
        <div className="space-y-2.5">
          {rows.map((r) => (
            <Card key={r.id} className="flex items-start gap-3 !p-3.5">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-800">
                <History className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t(`admin.act.${r.action}`)}</p>
                {r.note && <p className="break-words text-xs text-slate-600 dark:text-slate-300">{r.note}</p>}
                <p className="text-xs text-slate-400">
                  {t('admin.act.by')} {r.adminName || '—'} · {timeAgo(r.created_at, lang)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </QueryState>
  );
}
