import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services';
import { toast } from 'react-toastify';
import remoteLogger from '../../../utils/remoteLogger';

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    const refreshTokenValue = localStorage.getItem('refreshToken');

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        if (refreshTokenValue) {
          setIsAuthenticated(true);

          if (!token) {
            remoteLogger.warn('AccessToken missing but refreshToken exists - will refresh on next API call');
          }
        } else if (token) {
          setIsAuthenticated(true);
          remoteLogger.info('User authenticated with accessToken only', { username: parsedUser.username });
        }
      } catch (error) {
        remoteLogger.error('Error parsing user data', { error: error?.message || String(error), stack: error?.stack });
      }
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      remoteLogger.info('Login attempt', { username: credentials.username });
      const response = await authService.login(credentials);
      remoteLogger.info('Login response', { response });

      const { accessToken, refreshToken, user: userData } = response;

      const existingToken = localStorage.getItem('accessToken');
      if (existingToken) {
        remoteLogger.info('Clearing old tokens before saving new ones');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      remoteLogger.info('Saving tokens and user to localStorage');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      remoteLogger.info('Saved to localStorage successfully');
      setUser(userData);
      setIsAuthenticated(true);

      toast.success('Successfully logged in!');
      return { success: true };
    } catch (error) {
      remoteLogger.error('Login error', { error: error?.message || String(error), stack: error?.stack });
      toast.error(error.message || 'An error occurred during login');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setLoading(true);
      await authService.register(userData);

      toast.success('Registration successful! You can now log in.');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'An error occurred during registration');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    remoteLogger.info('Logout called');
    try {
      await authService.logout();
      remoteLogger.info('Backend logout successful');
    } catch (error) {
      remoteLogger.error('Logout error', { error: error?.message || String(error), stack: error?.stack });
    } finally {
      remoteLogger.info('Clearing localStorage and resetting auth state');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      remoteLogger.info('Logout completed');
      toast.success('Successfully logged out');
      try {
        navigate('/', { replace: true });
      } catch (e) {
        remoteLogger.warn('Navigation after logout failed', { error: e?.message || String(e) });
      }
    }
  };

  const refreshToken = async () => {
    try {
      const response = await authService.refreshToken();
      const { accessToken, refreshToken: newRefreshToken } = response;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', newRefreshToken);

      return true;
    } catch (error) {
      remoteLogger.error('Token refresh error', { error: error?.message || String(error), stack: error?.stack });
      logout();
      return false;
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};