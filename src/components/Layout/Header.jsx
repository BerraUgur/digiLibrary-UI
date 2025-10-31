import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, User, LogOut } from "lucide-react";
import ThemeToggle from "../UI/buttons/ThemeToggle";
import { useAuth } from "../../features/auth/context/useAuth";
import { messageService } from "../../services";
import { ROLES } from '../../constants/rolesConstants';
import remoteLogger from '../../utils/remoteLogger';

const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread count for admin
  useEffect(() => {
  // Only run for admin users
  if (!isAuthenticated || user?.role !== ROLES.ADMIN) return;

    // Fetch unread message count and set up polling/event listener
    const fetchUnreadCount = async () => {
      try {
        const data = await messageService.getUnreadCount();
        setUnreadCount(data.count || 0);
      } catch (error) {
        remoteLogger.error('Failed to fetch unread count', { error: error?.message || String(error), stack: error?.stack });
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
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo */}
        <div className="text-2xl font-bold text-blue-600">DigiLibrary</div>

        {/* Navigation menu */}
        <nav className="hidden md:flex space-x-6">
          <Link to="/" className="text-gray-700 hover:text-blue-600 transition font-medium">
            Home
          </Link>
          <Link to="/books" className="text-gray-700 hover:text-blue-600 transition font-medium">
            Books
          </Link>
          {isAuthenticated && user?.role !== ROLES.ADMIN && (
            <Link to="/my-loans" className="text-gray-700 hover:text-blue-600 transition font-medium">
              My Loans
            </Link>
          )}
          <Link to="/about" className="text-gray-700 hover:text-blue-600 transition font-medium">
            About
          </Link>
          <Link to="/contact" className="text-gray-700 hover:text-blue-600 transition font-medium">
            Contact
          </Link>
          {isAuthenticated && user?.role === ROLES.ADMIN && (
            <>
              <Link to="/admin/messages" className="text-gray-700 hover:text-blue-600 transition relative flex items-center gap-1 font-medium">
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
              <Link to="/admin/loans" className="text-gray-700 hover:text-blue-600 transition font-medium">
                Loan Management
              </Link>
              <Link to="/admin/users" className="text-gray-700 hover:text-blue-600 transition font-medium">
                User Management
              </Link>
            </>
          )}
        </nav>
        <div className="flex gap-2 items-center">
          <ThemeToggle />
          {/* User menu */}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <button className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition">
                  <User size={20} />
                  <span>Profile</span>
                </button>
              </Link>
              <button
                onClick={logout}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-full hover:bg-red-700 transition"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition">
                  <User size={20} />
                  <span>Login</span>
                </button>
              </Link>
              <Link to="/register">
                <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-full hover:bg-green-700 transition">
                  <BookOpen size={20} />
                  <span>Register</span>
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
