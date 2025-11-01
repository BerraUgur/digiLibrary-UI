import React from "react";
import { useLanguage } from "../../../context/useLanguage";
import TRFlag from "../../../assets/TRFlag.png";
import USFlag from "../../../assets/USFlag.png";

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      aria-label="Toggle language"
      title={language === 'tr' ? "Switch to English" : "Türkçe'ye geç"}
      className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition flex items-center justify-center"
    >
      <img 
        src={language === 'tr' ? USFlag : TRFlag} 
        alt={language === 'tr' ? "English" : "Türkçe"} 
        className="w-[18px] h-[18px] object-cover rounded-sm"
      />
    </button>
  );
};

export default LanguageToggle;
