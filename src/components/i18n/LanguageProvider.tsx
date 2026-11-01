'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, LanguageCode, TranslationDictionary } from '@/lib/i18n/translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationDictionary;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: translations.en,
  isRTL: false,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>('en');

  // Synchronously initialize language from localStorage on client mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('saad_language') as LanguageCode | null;
      if (stored === 'en' || stored === 'ur') {
        setLanguageState(stored);
      }
    } catch {}
  }, []);

  // Sync RTL attribute and lang on <html> document element
  useEffect(() => {
    const root = document.documentElement;
    if (language === 'ur') {
      root.setAttribute('dir', 'rtl');
      root.setAttribute('lang', 'ur');
      document.body.classList.add('rtl-layout');
    } else {
      root.setAttribute('dir', 'ltr');
      root.setAttribute('lang', 'en');
      document.body.classList.remove('rtl-layout');
    }
  }, [language]);

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem('saad_language', newLang);
    } catch {}
  };

  const t = translations[language] || translations.en;
  const isRTL = language === 'ur';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

