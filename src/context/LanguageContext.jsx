import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translations } from '../lib/translations';
import { part2En, part2Ta } from '../lib/translations2';
import { part3En, part3Ta } from '../lib/translations3';

const LanguageContext = createContext(null);
const KEY = 'lifehelp-lang';

const dictionary = {
  en: { ...translations.en, ...part2En, ...part3En },
  ta: { ...translations.ta, ...part2Ta, ...part3Ta },
};

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
  const t = useCallback((key) => dictionary[lang][key] ?? dictionary.en[key] ?? key, [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => useContext(LanguageContext);
