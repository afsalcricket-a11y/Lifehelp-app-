import { List, Map } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function ViewToggle({ value, onChange }) {
  const { t } = useLanguage();
  const items = [
    { value: 'list', label: t('view.list'), icon: List },
    { value: 'map', label: t('view.map'), icon: Map },
  ];
  return (
    <div role="group" aria-label={t('view.map')} className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 dark:bg-slate-800">
      {items.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          className={`flex h-10 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition ${
            value === v ? 'bg-white text-brand-700 shadow dark:bg-slate-700 dark:text-brand-300' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
