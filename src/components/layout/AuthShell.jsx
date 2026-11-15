import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';
import LanguageToggle from '../ui/LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

export default function AuthShell({ title, subtitle, children, footer }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-400 px-6 pb-16 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-white/10" />
        <div className="relative mx-auto flex max-w-md items-center justify-end">
          <LanguageToggle />
          <ThemeToggle />
        </div>
        <div className="relative mx-auto mt-2 flex max-w-md flex-col items-center text-center animate-fade-up">
          <div className="rounded-3xl bg-white p-1.5 shadow-xl">
            <Logo size={56} />
          </div>
          <h1 className="mt-3 text-2xl font-extrabold tracking-wide">LIFEHELP</h1>
          <p className="mt-1 text-xs font-medium text-white/90">{t('app.tagline')}</p>
        </div>
      </div>

      <div className="relative mx-auto -mt-8 max-w-md px-4 pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="animate-fade-up rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{title}</h2>
          <p className="mb-5 mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          {children}
        </div>
        <div className="mt-5 text-center text-sm text-slate-600 dark:text-slate-400">{footer}</div>
      </div>
    </div>
  );
}
