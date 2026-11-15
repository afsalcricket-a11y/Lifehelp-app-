import { Inbox, RefreshCw } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { errorKey } from '../../lib/db';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import Button from './Button';

// Shows loading / error / empty states for a useAsync result, otherwise renders children(data).
export default function QueryState({ query, isEmpty, emptyTitle, emptyText, children }) {
  const { t } = useLanguage();
  const { data, loading, error, reload } = query;

  if (loading && !data) {
    return (
      <div className="flex justify-center py-14 text-brand-600">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="max-w-xs text-sm text-slate-600 dark:text-slate-300">{t(errorKey(error))}</p>
        <Button variant="secondary" icon={RefreshCw} onClick={reload}>
          {t('common.retry')}
        </Button>
      </div>
    );
  }
  if (data == null || isEmpty(data)) {
    return <EmptyState icon={Inbox} title={emptyTitle || t('common.noItems')} text={emptyText ?? t('common.noItemsHint')} />;
  }
  return <div className={loading ? 'opacity-60 transition' : 'transition'}>{children(data)}</div>;
}
