import React from 'react';
import { useLanguage } from '../../context/useLanguage';

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="footer bg-gray-100 dark:bg-slate-900 py-4 text-center text-gray-600 dark:text-slate-400 w-full">
      <span>© 2025 {t.header.logo}. {t.footer.rights}</span>
    </footer>
  );
};

export default Footer;