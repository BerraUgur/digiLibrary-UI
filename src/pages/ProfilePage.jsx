import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userService, loanService, favoriteService, reviewService } from '../services/api';
import { toast } from 'react-toastify';
import { User, Lock, BookOpen, Heart, Package, MessageSquare } from 'lucide-react';
import Button from '../components/UI/Button';
import './ProfilePage.css';

function ProfilePage() {
  const navigate = useNavigate();
  const { user} = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');
  
  // Profile data
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
  });
  
  // Password data
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // Stats
  const [stats, setStats] = useState({
    activeLoans: 0,
    totalFavorites: 0,
    memberSince: '',
    completedLoans: 0,
    totalReviews: 0,
    totalLateFees: 0,
  });
  
  // User reviews
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    fetchProfileData();
    fetchStats();
  }, [user, navigate]);

  const fetchProfileData = async () => {
    try {
      const data = await userService.getProfile();
      setProfileData({
        username: data.username || '',
        email: data.email || '',
      });
      setStats(prev => ({
        ...prev,
        memberSince: new Date(data.createdAt).toLocaleDateString('tr-TR'),
      }));
    } catch {
      toast.error('Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const [loans, favData, reviews] = await Promise.all([
        loanService.getUserLoans().catch(() => []),
        favoriteService.list().catch(() => ({ favorites: [] })),
        reviewService.getUserReviews().catch(() => []),
      ]);
      
      // Backend {favorites: [...]} dönüyor
      const favorites = favData.favorites || favData || [];
      
      // Completed loans ve late fees hesapla
      const completedLoans = loans.filter(loan => loan.isReturned).length;
      const totalLateFees = loans.reduce((sum, loan) => sum + (loan.lateFee || 0), 0);
      
      setStats(prev => ({
        ...prev,
        activeLoans: loans.filter(loan => !loan.isReturned).length,
        totalFavorites: Array.isArray(favorites) ? favorites.length : 0,
        completedLoans,
        totalReviews: reviews.length,
        totalLateFees,
      }));
    } catch (_error) {
      console.error('Stats fetch error:', _error);
    }
  };

  const fetchUserReviews = async () => {
    setReviewsLoading(true);
    try {
      const reviews = await reviewService.getUserReviews();
      setUserReviews(reviews);
    } catch {
      toast.error('Yorumlar yüklenirken hata oluştu');
    } finally {
      setReviewsLoading(false);
    }
  };

  const fetchAllReviews = async () => {
    setReviewsLoading(true);
    try {
      const reviews = await reviewService.getAllReviews();
      setUserReviews(reviews);
    } catch {
      toast.error('Yorumlar yüklenirken hata oluştu');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await userService.updateProfile(profileData);
      toast.success('Profil başarıyla güncellendi!');
    } catch (error) {
      toast.error(error.message || 'Profil güncellenirken hata oluştu');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Yeni şifreler eşleşmiyor!');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      toast.error('Yeni şifre en az 6 karakter olmalı!');
      return;
    }
    
    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Şifre başarıyla değiştirildi!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.message || 'Şifre değiştirilemedi');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Profil yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div className="profile-info">
            <h1>{profileData.username}</h1>
            <p className="user-email">{profileData.email}</p>
            <p className="user-role">
              {user?.role === 'admin' ? '👑 Admin' : '📚 Üye'}
            </p>
            <p className="user-member-since">
              📅 Üyelik Tarihi: {stats.memberSince}
            </p>
          </div>
        </div>

        {/* Stats Cards - Admin için özel, normal kullanıcılar için farklı */}
        {user?.role === 'admin' ? (
          <div className="admin-dashboard-info">
            <div className="admin-welcome-card">
              <h2>👑 Admin Panel</h2>
              <p>Kütüphane yönetim paneline hoş geldiniz! Buradan tüm işlemleri yönetebilirsiniz.</p>
              
              <div className="admin-quick-links">
                <button 
                  onClick={() => navigate('/books')}
                  className="quick-link-btn"
                >
                  📚 Kitap Yönetimi
                </button>
                <button 
                  onClick={() => navigate('/admin/loans')}
                  className="quick-link-btn"
                >
                  📦 Ödünç Yönetimi
                </button>
                <button 
                  onClick={() => navigate('/admin/users')}
                  className="quick-link-btn"
                >
                  👥 Kullanıcı Yönetimi
                </button>
                <button 
                  onClick={() => navigate('/admin/messages')}
                  className="quick-link-btn"
                >
                  💬 Mesajlar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-grid stats-grid-4">
            <div className="stat-card">
              <Package className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.activeLoans}</h3>
                <p>Aktif Ödünç</p>
              </div>
            </div>
            
            <div className="stat-card">
              <Heart className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalFavorites}</h3>
                <p>Favori Kitaplar</p>
              </div>
            </div>
            
            <div className="stat-card">
              <Package className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.completedLoans}</h3>
                <p>Tamamlanan Ödünçler</p>
              </div>
            </div>
            
            <div className="stat-card">
              <MessageSquare className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalReviews}</h3>
                <p>Yazdığım Yorumlar</p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            Profil Bilgileri
          </button>
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} />
            Şifre Değiştir
          </button>
          <button
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('reviews');
              if (user?.role === 'admin') {
                fetchAllReviews();
              } else {
                fetchUserReviews();
              }
            }}
          >
            <MessageSquare size={18} />
            {user?.role === 'admin' ? 'Tüm Yorumlar' : 'Yorumlarım'}
          </button>
          {user?.role !== 'admin' && (
            <button
              className="tab"
              onClick={() => navigate('/late-fees')}
            >
              <span style={{ fontSize: '18px' }}>₺</span>
              Geç İade Ücretleri
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <h2>Profil Bilgilerini Güncelle</h2>
              
              <div className="form-group">
                <label>Kullanıcı Adı</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-actions">
                <Button type="submit" color="primary">
                  Güncelle
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <h2>Şifre Değiştir</h2>
              
              <div className="form-group">
                <label>Mevcut Şifre</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Yeni Şifre</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label>Yeni Şifre (Tekrar)</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="form-actions">
                <Button type="submit" color="success">
                  Şifreyi Değiştir
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-section">
              <h2>{user?.role === 'admin' ? 'Tüm Yorumlar' : 'Yazdığım Yorumlar'}</h2>
              
              {reviewsLoading ? (
                <div className="loading-message">Yorumlar yükleniyor...</div>
              ) : userReviews.length === 0 ? (
                <div className="empty-message">
                  <MessageSquare size={48} />
                  <p>{user?.role === 'admin' ? 'Henüz hiç yorum yok.' : 'Henüz hiç yorum yazmadınız.'}</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {userReviews.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <div className="book-info">
                          <BookOpen size={20} />
                          <div>
                            <h3>{review.book?.title || 'Kitap bulunamadı'}</h3>
                            {user?.role === 'admin' && review.user && (
                              <small style={{ color: '#666' }}>
                                Kullanıcı: {review.user.username} ({review.user.email})
                              </small>
                            )}
                          </div>
                        </div>
                        <div className="review-rating">
                          {'⭐'.repeat(review.rating)}
                        </div>
                      </div>
                      <p className="review-text">{review.reviewText}</p>
                      <div className="review-footer">
                        <span className="review-date">
                          {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                        </span>
                        <button
                          className="delete-review-btn"
                          onClick={async () => {
                            if (window.confirm('Bu yorumu silmek istediğinize emin misiniz?')) {
                              try {
                                await reviewService.deleteReview(review._id);
                                toast.success('Yorum silindi');
                                if (user?.role === 'admin') {
                                  fetchAllReviews();
                                } else {
                                  fetchUserReviews();
                                  fetchStats();
                                }
                              } catch {
                                toast.error('Yorum silinemedi');
                              }
                            }
                          }}
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}


        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
