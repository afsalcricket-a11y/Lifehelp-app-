import { Languages } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageToggle({ className = '' }) {
  const { lang, toggleLang } = useLanguage();
  return (
    <button
      onClick={toggleLang}
      aria-label={lang === 'en' ? 'தமிழுக்கு மாற்று' : 'Switch to English'}
      className={`flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition hover:bg-black/5 active:scale-95 dark:hover:bg-white/10 ${className}`}
    >
      <Languages className="h-5 w-5" />
      {lang === 'en' ? 'தமிழ்' : 'EN'}
    </button>
  );
}
