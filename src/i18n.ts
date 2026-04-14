import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import it from './locales/it/translation.json';
import en from './locales/en/translation.json';

// Recupera la lingua salvata, default italiano
const savedLang = localStorage.getItem('artbook-lang') || 'it';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      it: { translation: it },
      en: { translation: en },
    },
    lng: savedLang,
    fallbackLng: 'it',
    interpolation: {
      escapeValue: false,
    },
  });

// Salva la lingua ogni volta che cambia
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('artbook-lang', lng);
});

export default i18n;