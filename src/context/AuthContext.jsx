import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Token kontrolü ve kullanıcı bilgilerini yükleme
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');
    const refreshTokenValue = localStorage.getItem('refreshToken');
    
    // Eğer accessToken yoksa ama refreshToken ve user varsa, kullanıcıyı authenticated say
    // (Token refresh mekanizması API çağrılarında otomatik çalışacak)
    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // RefreshToken varsa authenticated say (accessToken yoksa bile)
        if (refreshTokenValue) {
          setIsAuthenticated(true);
          
          // AccessToken yoksa uyarı ver ama logout yapma
          if (!token) {
            console.warn('⚠️ AccessToken missing but refreshToken exists - will refresh on next API call');
          }
        } else if (token) {
          // RefreshToken yok ama accessToken varsa (olağandışı durum)
          setIsAuthenticated(true);
          console.log('✅ User authenticated with accessToken only:', parsedUser.username);
        } else {
          // İkisi de yoksa authenticated değil
          console.warn('⚠️ No tokens found - user not authenticated');
          localStorage.removeItem('user'); // User data'yı da temizle
        }
      } catch (error) {
        console.error('❌ Error parsing user data - CLEARING STORAGE:', error);
        console.error('❌ Invalid userData was:', userData);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
    } else {
      console.warn('⚠️ No user data found in localStorage');
      // User data yoksa diğer token'ları da temizle
      if (token || refreshTokenValue) {
        console.warn('⚠️ Tokens exist but no user data - clearing tokens');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
    console.log('✅ AuthContext useEffect completed');
  }, []);

  // Giriş işlemi
  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('🔐 Login attempt with:', credentials.username);
      const response = await authService.login(credentials);
      console.log('✅ Login response:', response);
      
      const { accessToken, refreshToken, user: userData } = response;
      
      // Önce localStorage'ı kontrol et ve temizle
      const existingToken = localStorage.getItem('accessToken');
      if (existingToken) {
        console.log('🧹 Clearing old tokens before saving new ones...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      
      console.log('💾 Saving to localStorage...');
      console.log('   - accessToken:', accessToken ? `${accessToken.slice(0, 20)}...` : 'MISSING');
      console.log('   - refreshToken:', refreshToken ? `${refreshToken.slice(0, 20)}...` : 'MISSING');
      console.log('   - user:', userData);
      
      // Kesinlikle kaydet
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('✅ Saved to localStorage successfully');
      console.log('🔍 Verifying localStorage...');
      console.log('   - accessToken:', localStorage.getItem('accessToken') ? 'EXISTS' : 'MISSING');
      console.log('   - refreshToken:', localStorage.getItem('refreshToken') ? 'EXISTS' : 'MISSING');
      console.log('   - user:', localStorage.getItem('user') ? 'EXISTS' : 'MISSING');
      
      // Double check - eğer hala yoksa tekrar dene
      if (!localStorage.getItem('accessToken')) {
        console.error('❌ CRITICAL: accessToken not saved! Retrying...');
        localStorage.setItem('accessToken', accessToken);
        console.log('🔄 Retry result:', localStorage.getItem('accessToken') ? 'SUCCESS' : 'FAILED');
      }
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast.success('Başarıyla giriş yapıldı!');
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      toast.error(error.message || 'Giriş yapılırken bir hata oluştu');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Kayıt işlemi
  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      toast.success('Kayıt başarılı! Giriş yapabilirsiniz.');
      return { success: true };
    } catch (error) {
      toast.error(error.message || 'Kayıt olurken bir hata oluştu');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Çıkış işlemi
  const logout = async () => {
    console.log('🚪 LOGOUT CALLED!');
    console.trace('🔍 Logout called from:'); // Stack trace'i göster
    try {
      await authService.logout();
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      console.log('🗑️ Clearing localStorage...');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
      console.log('✅ Logout completed');
      toast.success('Başarıyla çıkış yapıldı');
    }
  };

  // Token yenileme
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

  // Kullanıcı bilgilerini güncelleme
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