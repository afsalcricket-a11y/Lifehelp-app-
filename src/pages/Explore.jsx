import { useMemo, useState } from 'react';
import { SearchX } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import SearchBar from '../components/ui/SearchBar';
import ModuleCard from '../components/ui/ModuleCard';
import EmptyState from '../components/ui/EmptyState';
import { MODULES } from '../data/modules';

export default function Explore() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MODULES;
    return MODULES.filter((m) => `${t(m.titleKey)} ${t(m.descKey)}`.toLowerCase().includes(q));
  }, [query, t]);

  return (
    <div className="space-y-5">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('explore.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('explore.subtitle')}</p>
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder={t('common.search')} />
      {results.length ? (
        <div className="space-y-3">
          {results.map((m, i) => (
            <div key={m.slug} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
              <ModuleCard module={m} layout="row" />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState icon={SearchX} title={t('common.noResults')} text={t('common.noResultsHint')} />
      )}
    </div>
  );
}
