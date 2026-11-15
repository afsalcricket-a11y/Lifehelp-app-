import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Hammer } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { MODULES } from '../data/modules';
import Button from '../components/ui/Button';

// Honest "not built yet" screen for modules scheduled for later development stages.
export default function ModulePlaceholder() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const module = MODULES.find((m) => m.slug === slug && !m.available);
  if (!module) return <Navigate to="/explore" replace />;
  const Icon = module.icon;

  return (
    <div className="flex flex-col items-center px-4 pt-10 text-center animate-fade-up">
      <span className={`mb-5 flex h-20 w-20 items-center justify-center rounded-3xl ${module.tile}`}>
        <Icon className="h-10 w-10" />
      </span>
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t(module.titleKey)}</h1>
      <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <Hammer className="h-3.5 w-3.5" />
        {t('common.comingSoon')}
      </span>
      <p className="mt-4 max-w-xs text-sm text-slate-500 dark:text-slate-400">{t('common.comingSoonText')}</p>
      <Button as={Link} to="/explore" variant="secondary" icon={ArrowLeft} className="mt-8">
        {t('common.back')}
      </Button>
    </div>
  );
}
