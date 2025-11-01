import { useContext } from 'react';
import LanguageContext from './LanguageContext';
import { translations } from './translations';

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }

  const { language } = context;
  const t = translations[language];

  const translateCategory = (category) => {
    if (!category) return category;
    return t.books.categories[category] || category;
  };

  return { ...context, t, translateCategory };
};
