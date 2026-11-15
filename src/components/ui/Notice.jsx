import { Info, ShieldAlert } from 'lucide-react';

const TONES = {
  info: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  warn: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
};

export default function Notice({ tone = 'info', children }) {
  const Icon = tone === 'warn' ? ShieldAlert : Info;
  return (
    <div className={`flex gap-3 rounded-2xl border p-3.5 ${TONES[tone]}`}>
      <Icon className="mt-0.5 h-5 w-5 shrink-0" />
      <p className="text-sm">{children}</p>
    </div>
  );
}
