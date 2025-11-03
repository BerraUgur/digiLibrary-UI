import { useState, useEffect } from "react";
import LanguageContext from "./LanguageContext";
import { translations } from "./translations";

const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en'; // default to English
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'tr' ? 'en' : 'tr');
  };

  // Get translations for current language
  const t = translations[language];

  // Category translation helper
  const translateCategory = (category) => {
    if (!category) return '';
    
    const categoryMap = {
      // English to Turkish
      'Novel': 'Roman',
      'Science': 'Bilim',
      'History': 'Tarih',
      'Philosophy': 'Felsefe',
      'Literature': 'Edebiyat',
      'Classic': 'Klasik',
      'Poetry': 'Şiir',
      'Biography': 'Biyografi',
      'Other': 'Diğer',
      'Science Fiction': 'Bilim Kurgu',
      'Children': 'Çocuk',
      'Psychology': 'Psikoloji',
      'Travel': 'Gezi',
      'Art': 'Sanat',
      'Religion': 'Din',
      'Technology': 'Teknoloji',
      // Turkish to English
      'Roman': 'Novel',
      'Bilim': 'Science',
      'Tarih': 'History',
      'Felsefe': 'Philosophy',
      'Edebiyat': 'Literature',
      'Klasik': 'Classic',
      'Şiir': 'Poetry',
      'Biyografi': 'Biography',
      'Diğer': 'Other',
      'Bilim Kurgu': 'Science Fiction',
      'Çocuk': 'Children',
      'Psikoloji': 'Psychology',
      'Gezi': 'Travel',
      'Sanat': 'Art',
      'Din': 'Religion',
      'Teknoloji': 'Technology'
    };

    // Return the translation based on current language
    if (language === 'tr') {
      // If category is in English, translate to Turkish
      return categoryMap[category] || category;
    } else {
      // If category is in Turkish, translate to English (or keep as is if already English)
      return categoryMap[category] || category;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, translateCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
