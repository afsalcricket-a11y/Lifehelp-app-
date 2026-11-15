import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations } from '../lib/translations';

const LanguageContext = createContext(null);
const KEY = 'lifehelp-lang';

function initialLang() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'ta') return saved;
  } catch {
    /* ignore */
  }
  return 'en';
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(KEY, lang);
    } catch {
      /* ignore */
    }
  }, [lang]);

  const setLang = useCallback((l) => setLangState(l === 'ta' ? 'ta' : 'en'), []);
  const toggleLang = useCallback(() => setLangState((l) => (l === 'en' ? 'ta' : 'en')), []);
  const t = useCallback((key) => translations[lang][key] ?? translations.en[key] ?? key, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
