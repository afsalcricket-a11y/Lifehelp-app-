import Logo from '../ui/Logo';
import { useLanguage } from '../../context/LanguageContext';

export default function SplashScreen() {
  const { t } = useLanguage();
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-teal-400 px-6 text-white">
      <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center justify-center">
        <span className="absolute h-24 w-24 animate-pulse-ring rounded-full bg-white/40" />
        <span className="absolute h-24 w-24 animate-pulse-ring rounded-full bg-white/30 [animation-delay:0.6s]" />
        <div className="relative animate-float rounded-[28px] bg-white p-2 shadow-2xl">
          <Logo size={80} />
        </div>
      </div>

      <h1 className="mt-8 animate-fade-up text-4xl font-extrabold tracking-wide [animation-delay:0.2s]">LIFEHELP</h1>
      <p className="mt-2 max-w-xs animate-fade-up text-center text-sm font-medium text-white/90 [animation-delay:0.4s]">
        {t('app.tagline')}
      </p>

      <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+3rem)] h-1.5 w-40 overflow-hidden rounded-full bg-white/25">
        <div className="h-full w-2/5 animate-bar-load rounded-full bg-white" />
      </div>
    </div>
  );
}
