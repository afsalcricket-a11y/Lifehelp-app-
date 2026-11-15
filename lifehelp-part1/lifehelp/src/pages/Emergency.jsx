import { Phone, PhoneCall, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { EMERGENCY_NUMBERS } from '../data/modules';

// Base emergency screen: direct-dial links only. Richer content arrives in the Emergency module stage.
export default function Emergency() {
  const { t } = useLanguage();
  return (
    <div className="space-y-5">
      <div className="animate-fade-up">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{t('emergency.title')}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('emergency.subtitle')}</p>
      </div>

      <Card className="animate-fade-up border-red-200 bg-red-50 text-center dark:border-red-500/30 dark:bg-red-500/10">
        <div className="relative mx-auto mb-4 mt-2 flex h-20 w-20 items-center justify-center">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-red-500/40" />
          <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-red-600/40">
            <PhoneCall className="h-9 w-9" />
          </span>
        </div>
        <p className="text-4xl font-black tracking-wider text-red-600 dark:text-red-400">112</p>
        <p className="mb-4 mt-1 text-sm text-red-800/80 dark:text-red-200/80">{t('emergency.call112Hint')}</p>
        <Button as="a" href="tel:112" variant="danger" fullWidth icon={Phone}>
          {t('emergency.call112')}
        </Button>
      </Card>

      <section>
        <h2 className="mb-3 text-base font-bold text-slate-900 dark:text-white">{t('emergency.other')}</h2>
        <div className="space-y-2.5">
          {EMERGENCY_NUMBERS.map((n) => (
            <a
              key={n.number}
              href={`tel:${n.number}`}
              className="flex items-center gap-4 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900"
            >
              <span className="flex h-11 min-w-[3.25rem] items-center justify-center rounded-xl bg-slate-100 px-2 text-base font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                {n.number}
              </span>
              <span className="flex-1 font-semibold text-slate-800 dark:text-slate-100">{t(n.labelKey)}</span>
              <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 dark:text-brand-400">
                <Phone className="h-4 w-4" />
                {t('emergency.call')}
              </span>
            </a>
          ))}
        </div>
      </section>

      <Card className="flex gap-3 border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <p className="text-sm text-amber-900 dark:text-amber-200">{t('emergency.note')}</p>
      </Card>
    </div>
  );
}
