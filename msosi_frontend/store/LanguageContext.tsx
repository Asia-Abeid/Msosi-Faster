import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Localization from 'expo-localization';
import i18n from '../constants/i18n';
import * as SecureStore from 'expo-secure-store';

type LanguageContextType = {
  locale: string;
  setLanguage: (lang: string) => Promise<void>;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState(i18n.locale);

  useEffect(() => {
    const loadLocale = async () => {
      const savedLocale = await SecureStore.getItemAsync('app_locale');
      if (savedLocale) {
        i18n.locale = savedLocale;
        setLocale(savedLocale);
      } else {
        const deviceLocale = Localization.getLocales()[0].languageCode ?? 'en';
        i18n.locale = deviceLocale;
        setLocale(deviceLocale);
      }
    };
    loadLocale();
  }, []);

  const setLanguage = async (lang: string) => {
    i18n.locale = lang;
    setLocale(lang);
    await SecureStore.setItemAsync('app_locale', lang);
  };

  return (
    <LanguageContext.Provider value={{ locale, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
