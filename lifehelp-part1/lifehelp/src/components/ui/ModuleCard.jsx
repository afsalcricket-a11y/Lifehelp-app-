import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ModuleCard({ module, layout = 'grid' }) {
  const { t } = useLanguage();
  const Icon = module.icon;

  if (layout === 'row') {
    return (
      <Link
        to={module.path}
        className="flex items-center gap-4 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition active:scale-[0.99] hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
      >
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${module.tile}`}>
          <Icon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-slate-900 dark:text-slate-100">{t(module.titleKey)}</span>
          <span className="block truncate text-sm text-slate-500 dark:text-slate-400">{t(module.descKey)}</span>
        </span>
        <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
      </Link>
    );
  }

  return (
    <Link
      to={module.path}
      className="group flex flex-col rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition active:scale-[0.98] hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
    >
      <span className={`mb-3 flex h-12 w-12 items-center justify-center rounded-2xl ${module.tile}`}>
        <Icon className="h-6 w-6" />
      </span>
      <span className="font-semibold leading-tight text-slate-900 dark:text-slate-100">{t(module.titleKey)}</span>
      <span className="mt-1 text-xs leading-snug text-slate-500 dark:text-slate-400">{t(module.descKey)}</span>
    </Link>
  );
}
