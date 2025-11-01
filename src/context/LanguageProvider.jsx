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
      // Turkish to English
      'Roman': 'Novel',
      'Bilim Kurgu': 'Science Fiction',
      'Tarih': 'History',
      'Biyografi': 'Biography',
      'Çocuk': 'Children',
      'Psikoloji': 'Psychology',
      'Felsefe': 'Philosophy',
      'Şiir': 'Poetry',
      'Gezi': 'Travel',
      'Sanat': 'Art',
      'Din': 'Religion',
      'Bilim': 'Science',
      'Teknoloji': 'Technology',
      // English to Turkish
      'Novel': 'Roman',
      'Science Fiction': 'Bilim Kurgu',
      'History': 'Tarih',
      'Biography': 'Biyografi',
      'Children': 'Çocuk',
      'Psychology': 'Psikoloji',
      'Philosophy': 'Felsefe',
      'Poetry': 'Şiir',
      'Travel': 'Gezi',
      'Art': 'Sanat',
      'Religion': 'Din',
      'Science': 'Bilim',
      'Technology': 'Teknoloji'
    };

    return categoryMap[category] || category;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage, t, translateCategory }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
