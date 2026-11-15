import { useLanguage } from '../../context/LanguageContext';
import Spinner from './Spinner';

export default function PageLoader() {
  const { t } = useLanguage();
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
      <Spinner className="h-8 w-8 text-brand-600" />
      <p className="text-sm">{t('common.loading')}</p>
    </div>
  );
}
