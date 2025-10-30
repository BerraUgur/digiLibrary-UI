import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services';
import { toast } from 'react-toastify';

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
            console.warn('AccessToken missing but refreshToken exists - will refresh on next API call');
          }
        } else if (token) {
          setIsAuthenticated(true);
          console.log('User authenticated with accessToken only:', parsedUser.username);
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('Login attempt with:', credentials.username);
      const response = await authService.login(credentials);
      console.log('Login response:', response);

      const { accessToken, refreshToken, user: userData } = response;

      const existingToken = localStorage.getItem('accessToken');
      if (existingToken) {
        console.log('Clearing old tokens before saving new ones...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }

      console.log('Saving to localStorage...');
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));

      console.log('Saved to localStorage successfully');
      setUser(userData);
      setIsAuthenticated(true);

      toast.success('Successfully logged in!');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
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
    console.log('LOGOUT CALLED!');
    try {
      await authService.logout();
      console.log('Backend logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      console.log('Clearing localStorage...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      console.log('Logout completed');
      toast.success('Successfully logged out');
      try {
        navigate('/', { replace: true });
      } catch (e) {
        console.warn('Navigation after logout failed', e);
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
      console.error('Token refresh error:', error);
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