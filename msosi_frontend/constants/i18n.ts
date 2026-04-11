import * as Localization from 'expo-localization';
import { I18n } from 'i18n-js';
import en from '../translations/en.json';
import sw from '../translations/sw.json';

const i18n = new I18n({
  en,
  sw,
});

// Set the locale once at the beginning of your app.
i18n.locale = Localization.getLocales()[0].languageCode ?? 'en';

// When a value is missing from a language it'll fall back to another language with the key present.
i18n.enableFallback = true;
i18n.defaultLocale = 'en';

export default i18n;
