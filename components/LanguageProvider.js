'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { TRANSLATIONS } from '../lib/translations';

const LanguageContext = createContext({ lang: 'en', setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState('en');

  useEffect(() => {
    const saved = typeof window !== 'undefined' && localStorage.getItem('verilo_lang');
    if (saved === 'hi' || saved === 'en') setLangState(saved);
  }, []);

  function setLang(l) {
    setLangState(l);
    if (typeof window !== 'undefined') localStorage.setItem('verilo_lang', l);
  }

  function t(key) {
    return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
