import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, User, LogOut, Menu, X } from "lucide-react";
import ThemeToggle from "../UI/buttons/ThemeToggle";
import LanguageToggle from "../UI/buttons/LanguageToggle";
import { useAuth } from "../../features/auth/context/useAuth";
import { useLanguage } from "../../context/useLanguage";
import { messageService } from "../../services";
import { ROLES } from '../../constants/rolesConstants';
import remoteLogger from '../../utils/remoteLogger';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fetch unread count for admin
  useEffect(() => {
    // Only run for admin users
    if (!isAuthenticated || !user || user?.role !== ROLES.ADMIN) {
      setUnreadCount(0);
      return;
    }

    // Fetch unread message count and set up polling/event listener
    const fetchUnreadCount = async () => {
      try {
        const data = await messageService.getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch (error) {
        // Silently handle 403 errors (user not authorized)
        if (error.status === 403) {
          setUnreadCount(0);
        } else {
          remoteLogger.error('Failed to fetch unread count', { error: error?.message || String(error), stack: error?.stack });
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    window.addEventListener('messagesUpdated', fetchUnreadCount);
    return () => {
      clearInterval(interval);
      window.removeEventListener('messagesUpdated', fetchUnreadCount);
    };
  }, [isAuthenticated, user]);

  return (
    <header className="bg-white dark:bg-slate-900 shadow-md sticky top-0 z-50 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
            {t.header.logo}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6">
            <Link to="/" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
              {t.header.home}
            </Link>
            <Link to="/books" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
              {t.header.books}
            </Link>
            {isAuthenticated && user?.role !== ROLES.ADMIN && (
              <>
                <Link to="/my-loans" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
                  {t.header.myLoans}
                </Link>
                <Link to="/favorites" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
                  {t.header.favorites}
                </Link>
              </>
            )}
            <Link to="/about" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
              {t.header.about}
            </Link>
            <Link to="/contact" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
              {t.header.contact}
            </Link>
            {isAuthenticated && user?.role === ROLES.ADMIN && (
              <>
                <Link to="/admin/messages" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition relative flex items-center gap-1 font-medium">
                  {t.header.messages}
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/admin/loans" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
                  {t.header.loanManagement}
                </Link>
                <Link to="/admin/users" className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium">
                  {t.header.userManagement}
                </Link>
              </>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-2 items-center">
            <LanguageToggle />
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link to="/profile">
                  <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition text-sm">
                    <User size={18} />
                    <span className="hidden xl:inline">{t.header.profile}</span>
                  </button>
                </Link>
                <button
                  onClick={logout}
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition text-sm"
                >
                  <LogOut size={18} />
                  <span className="hidden xl:inline">{t.header.logout}</span>
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link to="/login">
                  <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition text-sm">
                    <User size={18} />
                    <span>{t.header.login}</span>
                  </button>
                </Link>
                <Link to="/register">
                  <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition text-sm">
                    <BookOpen size={18} />
                    <span className="hidden sm:inline">{t.header.register}</span>
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <LanguageToggle />
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-gray-200 dark:border-slate-700 pt-4">
            <nav className="flex flex-col space-y-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.header.home}
              </Link>
              <Link
                to="/books"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.header.books}
              </Link>
              {isAuthenticated && user?.role !== ROLES.ADMIN && (
                <>
                  <Link
                    to="/my-loans"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t.header.myLoans}
                  </Link>
                  <Link
                    to="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t.header.favorites}
                  </Link>
                </>
              )}
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.header.about}
              </Link>
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
              >
                {t.header.contact}
              </Link>
              {isAuthenticated && user?.role === ROLES.ADMIN && (
                <>
                  <Link
                    to="/admin/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg relative inline-flex"
                  >
                    {t.header.messages}
                    {unreadCount > 0 && (
                      <span className="ml-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/admin/loans"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t.header.loanManagement}
                  </Link>
                  <Link
                    to="/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-gray-700 dark:text-slate-200 hover:text-blue-600 transition font-medium px-2 py-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    {t.header.userManagement}
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile Actions */}
            <div className="mt-4 flex flex-col gap-2">
              {isAuthenticated ? (
                <>
                  <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition">
                      <User size={20} />
                      <span>{t.header.profile}</span>
                    </button>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition"
                  >
                    <LogOut size={20} />
                    <span>{t.header.logout}</span>
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition">
                      <User size={20} />
                      <span>{t.header.login}</span>
                    </button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <button className="w-full flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition">
                      <BookOpen size={20} />
                      <span>{t.header.register}</span>
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
