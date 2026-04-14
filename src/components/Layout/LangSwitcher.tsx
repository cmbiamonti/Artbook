// src/components/Layout/LangSwitcher.tsx

import i18n from '../../i18n';
import { useTranslation } from 'react-i18next';

export const LangSwitcher = () => {
  const { i18n: i18nInstance } = useTranslation();
  const currentLang = i18nInstance.language;

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => i18n.changeLanguage('it')}
        className={`px-2 py-1 rounded-md text-sm font-medium transition-all ${
          currentLang === 'it'
            ? 'bg-green-100 text-red-900 shadow-sm font-semibold'
            : 'text-gray-500 hover:text-gray-800'
        }`}
        title="Italiano"
      >
        🇮🇹 IT
      </button>
      <button
        onClick={() => i18n.changeLanguage('en')}
        className={`px-2 py-1 rounded-md text-sm font-medium transition-all ${
          currentLang === 'en'
            ? 'bg-green-100 text-red-900 shadow-sm font-semibold'
            : 'text-gray-500 hover:text-gray-800'
        }`}
        title="English"
      >
        🇬🇧 EN
      </button>
    </div>
  );
};