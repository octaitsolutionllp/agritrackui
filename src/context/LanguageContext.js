import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { strings } from '../i18n/strings';
import { storage } from '../utils/storage';

const LANGUAGE_KEY = 'agritrack_language';
const DEFAULT_LANGUAGE = 'en';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(DEFAULT_LANGUAGE);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    storage.getItem(LANGUAGE_KEY).then((stored) => {
      if (stored && strings[stored]) {
        setLanguageState(stored);
      }
      setLoading(false);
    });
  }, []);

  const setLanguage = async (code) => {
    setLanguageState(code);
    await storage.setItem(LANGUAGE_KEY, code);
  };

  const value = useMemo(
    () => ({
      language,
      loading,
      setLanguage,
      strings: strings[language] ?? strings[DEFAULT_LANGUAGE],
    }),
    [language, loading]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
