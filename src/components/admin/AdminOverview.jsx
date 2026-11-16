import { Ban, Droplets, Flag, HandHeart, ShieldCheck, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { unwrap } from '../../lib/db';
import { useAsync } from '../../lib/useAsync';
import { useLanguage } from '../../context/LanguageContext';
import QueryState from '../ui/QueryState';
import Card from '../ui/Card';

const STATS = [
  { key: 'total_users', label: 'admin.stat.totalUsers', icon: Users, tile: 'bg-sky-100 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300' },
  { key: 'active_donors', label: 'admin.stat.activeDonors', icon: Droplets, tile: 'bg-rose-100 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300' },
  { key: 'open_help_requests', label: 'admin.stat.openRequests', icon: HandHeart, tile: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300' },
  { key: 'pending_verifications', label: 'admin.stat.pending', icon: ShieldCheck, tile: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300' },
  { key: 'open_reports', label: 'admin.stat.openReports', icon: Flag, tile: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300' },
  { key: 'suspended_users', label: 'admin.stat.suspended', icon: Ban, tile: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
];

export default function AdminOverview() {
  const { t } = useLanguage();
  const query = useAsync(async () => unwrap(await supabase.rpc('admin_stats')), []);
  return (
    <QueryState query={query} isEmpty={() => false}>
      {(stats) => (
        <div className="grid grid-cols-2 gap-3">
          {STATS.map(({ key, label, icon: Icon, tile }) => (
            <Card key={key} className="space-y-3">
              <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tile}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-3xl font-extrabold text-slate-900 dark:text-white">{Number(stats[key] ?? 0).toLocaleString('en-IN')}</p>
                <p className="text-xs font-medium leading-snug text-slate-500 dark:text-slate-400">{t(label)}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </QueryState>
  );
}
