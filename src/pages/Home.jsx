import { useMemo, useState } from 'react';
import { PhoneCall, SearchX, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import SearchBar from '../components/ui/SearchBar';
import ModuleCard from '../components/ui/ModuleCard';
import EmptyState from '../components/ui/EmptyState';
import Card from '../components/ui/Card';
import { MODULES } from '../data/modules';

export default function Home() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const firstName = (user?.user_metadata?.full_name || '').split(' ')[0];

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter((m) => `${t(m.titleKey)} ${t(m.descKey)}`.toLowerCase().includes(q));
  }, [query, t]);

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-brand-700 via-brand-600 to-teal-400 p-5 text-white shadow-xl shadow-brand-600/20 animate-fade-up">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 right-10 h-32 w-32 rounded-full bg-white/10" />
        <p className="relative text-sm font-medium text-white/85">
          {t('home.hello')}
          {firstName ? `, ${firstName}` : ''} 👋
        </p>
        <h2 className="relative mt-1 text-xl font-bold leading-snug">{t('home.heroText')}</h2>

        <a
          href="tel:112"
          className="relative mt-5 flex items-center gap-3 rounded-2xl bg-white p-3 text-slate-900 shadow-lg transition active:scale-[0.98]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
            <PhoneCall className="h-5 w-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-bold text-red-600">{t('home.sos')}</span>
            <span className="block truncate text-xs text-slate-500">{t('home.sosHint')}</span>
          </span>
        </a>
      </section>

      <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />

      <section>
        <h3 className="mb-3 text-base font-bold text-slate-900 dark:text-white">{t('home.modules')}</h3>
        {results.length ? (
          <div className="grid grid-cols-2 gap-3">
            {results.map((m, i) => (
              <div key={m.slug} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ModuleCard module={m} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={SearchX} title={t('common.noResults')} text={t('common.noResultsHint')} />
        )}
      </section>

      <Card className="flex gap-3 border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-900 dark:text-amber-200">{t('home.notice')}</p>
      </Card>
    </div>
  );
}
