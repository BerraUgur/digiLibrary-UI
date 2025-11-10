import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { userService, loanService, favoriteService, reviewService } from '../../../services';
import { toast } from 'react-toastify';
import { User, Lock, BookOpen, Heart, Package, MessageSquare, AlertTriangle } from 'lucide-react';
import ConfirmModal from '../../../components/UI/modals/ConfirmModal';
import ProfileSkeleton from '../../../components/UI/skeleton/ProfileSkeleton';
import Button from '../../../components/UI/buttons/Button';
import { ROLES } from '../../../constants/rolesConstants';
import { formatDate } from '../../../utils/dateFormatter';
import { formatPhoneNumber } from '../../../utils/phoneFormatter';
import '../styles/ProfilePage.css';
import remoteLogger from '../../../utils/remoteLogger';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');

  // Profile data
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    tcIdentity: '',
    phoneNumber: '',
    address: '',
    birthDate: '',
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

  // Ban info
  const [banInfo, setBanInfo] = useState(null); // { banUntil: Date, remainingDays: number }

  // User reviews
  const [userReviews, setUserReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchProfileData();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate]);

  const fetchProfileData = async () => {
    try {
      const data = await userService.getProfile();
      // Split username into firstName and lastName
      const nameParts = (data.username || '').split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      // Format birth date for input field (YYYY-MM-DD)
      let formattedBirthDate = '';
      if (data.birthDate) {
        const date = new Date(data.birthDate);
        formattedBirthDate = date.toISOString().split('T')[0];
      }
      
      setProfileData({
        firstName,
        lastName,
        email: data.email || '',
        tcIdentity: data.tcIdentity || '',
        phoneNumber: data.phoneNumber || '',
        address: data.address || '',
        birthDate: formattedBirthDate,
      });
      setStats(prev => ({
        ...prev,
        // Format as DD.MM.YYYY
        memberSince: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(data.createdAt)),
      }));

      // Check ban status
      if (data.isPermanentBan) {
        setBanInfo({
          isPermanent: true,
          banUntil: null,
          remainingDays: null,
        });
      } else if (data.banUntil) {
        const banDate = new Date(data.banUntil);
        const now = new Date();
        
        if (banDate > now) {
          const remainingDays = Math.ceil((banDate - now) / (1000 * 60 * 60 * 24));
          setBanInfo({
            isPermanent: false,
            banUntil: banDate,
            remainingDays,
          });
        }
      }
    } catch {
      toast.error(t.profile.profileLoadError);
    }
  };

  const fetchStats = async () => {
    try {
      const [loans, favData, reviews] = await Promise.all([
        loanService.getUserLoans().catch(() => []),
        favoriteService.list().catch(() => ({ favorites: [] })),
        reviewService.getUserReviews().catch(() => []),
      ]);

      // Backend returns {favorites: [...]} structure
      const favorites = favData.favorites || favData || [];

      // Calculate completed loans and late fees
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
      remoteLogger.error('Stats fetch error', { error: _error?.message || String(_error), stack: _error?.stack });
    }
  };

  const fetchUserReviews = async () => {
    setReviewsLoading(true);
    try {
      const reviews = await reviewService.getUserReviews();
      setUserReviews(reviews);
    } catch {
      toast.error(t.profile.reviewsLoadError);
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
      toast.error(t.profile.reviewsLoadError);
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!profileData.firstName?.trim()) {
      toast.error(language === 'tr' ? 'İsim alanı boş bırakılamaz' : 'First name cannot be empty');
      return;
    }
    
    if (!profileData.lastName?.trim()) {
      toast.error(language === 'tr' ? 'Soyisim alanı boş bırakılamaz' : 'Last name cannot be empty');
      return;
    }
    
    if (!profileData.email?.trim()) {
      toast.error(language === 'tr' ? 'E-posta alanı boş bırakılamaz' : 'Email cannot be empty');
      return;
    }
    
    if (!profileData.phoneNumber?.trim()) {
      toast.error(language === 'tr' ? 'Telefon numarası alanı boş bırakılamaz' : 'Phone number cannot be empty');
      return;
    }
    
    // Validate phone format: +90 XXX XXX XX XX (19 characters including spaces)
    if (profileData.phoneNumber.replace(/\s/g, '').length !== 13) {
      toast.error(language === 'tr' ? 'Geçersiz telefon numarası formatı' : 'Invalid phone number format');
      return;
    }
    
    if (!profileData.address?.trim()) {
      toast.error(language === 'tr' ? 'Adres alanı boş bırakılamaz' : 'Address cannot be empty');
      return;
    }
    
    if (profileData.address.trim().length < 10) {
      toast.error(language === 'tr' ? 'Adres en az 10 karakter olmalıdır' : 'Address must be at least 10 characters');
      return;
    }
    
    if (!profileData.birthDate) {
      toast.error(language === 'tr' ? 'Doğum tarihi alanı boş bırakılamaz' : 'Birth date cannot be empty');
      return;
    }
    
    // Check if user is at least 18 years old
    const birthDate = new Date(profileData.birthDate);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    if (age < 18) {
      toast.error(language === 'tr' ? '18 yaşından küçükler kayıt olamaz' : 'Must be at least 18 years old');
      return;
    }
    
    try {
      // Combine firstName and lastName into username
      const username = `${profileData.firstName.trim()} ${profileData.lastName.trim()}`.trim();
      await userService.updateProfile({ 
        username,
        email: profileData.email,
        phoneNumber: profileData.phoneNumber,
        address: profileData.address,
        birthDate: profileData.birthDate
      });
      toast.success(t.profile.profileUpdated);
      // Refresh profile data after update
      await fetchProfileData();
    } catch (error) {
      toast.error(error.message || t.profile.profileUpdateError);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t.profile.passwordsNotMatch);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error(t.profile.passwordTooShort);
      return;
    }

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success(t.profile.passwordChanged);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.message || t.profile.passwordChangeFailed);
    }
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            <User size={48} />
          </div>
          <div className="profile-info">
            <h1>{profileData.firstName} {profileData.lastName}</h1>
            <p className="user-email">{profileData.email}</p>
            <p className="user-role">
              {user?.role === ROLES.ADMIN ? `👑 ${t.profile.admin}` : `📚 ${t.profile.member}`}
            </p>
            <p className="user-member-since">
              📅 {t.profile.memberSinceLabel} {stats.memberSince}
            </p>
          </div>
        </div>

        {/* Ban Warning - Show if user is banned */}
        {banInfo && user?.role !== ROLES.ADMIN && (
          <div className="ban-warning-card">
            <div className="ban-icon">
              <AlertTriangle size={32} />
            </div>
            <div className="ban-content">
              <h3>⚠️ {t.profile.accountBanned || 'Hesabınız Yasaklandı'}</h3>
              {banInfo.isPermanent ? (
                <>
                  <p className="text-red-600 dark:text-red-400 font-bold text-lg">
                    🚫 Kalıcı Yasaklama (Süresiz)
                  </p>
                  <p className="mt-2">
                    Hesabınız kalıcı olarak yasaklanmıştır. Lütfen destek ile iletişime geçin.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    {t.profile.bannedUntil || 'Yasaklama Bitiş Tarihi'}: <strong>{formatDate(banInfo.banUntil)}</strong>
                  </p>
                  <p className="ban-remaining">
                    {t.profile.remainingDays || 'Kalan Gün'}: <strong>{banInfo.remainingDays} {t.profile.days || 'gün'}</strong>
                  </p>
                  <p className="ban-message">
                    {t.profile.banMessage || 'Bu süre boyunca kitap ödünç alamazsınız. Lütfen mevcut ödünç aldığınız kitapları zamanında iade edin.'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards - Different for Admin and Regular Users */}
        {user?.role === ROLES.ADMIN ? (
          <div className="admin-dashboard-info">
            <div className="admin-welcome-card">
              <h2>👑 {t.profile.adminPanel}</h2>
              <p>{t.profile.adminWelcome}</p>

              <div className="admin-quick-links">
                <button
                  onClick={() => navigate('/books')}
                  className="quick-link-btn"
                >
                  📚 {t.profile.manageBooks}
                </button>
                <button
                  onClick={() => navigate('/admin/loans')}
                  className="quick-link-btn"
                >
                  📦 {t.profile.manageLoans}
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="quick-link-btn"
                >
                  👥 {t.profile.manageUsers}
                </button>
                <button
                  onClick={() => navigate('/admin/messages')}
                  className="quick-link-btn"
                >
                  💬 {t.profile.messages}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="stats-grid stats-grid-4">
            <div className="stat-card stat-active">
              <Package className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.activeLoans}</h3>
                <p>{t.profile.activeLoans}</p>
              </div>
            </div>

            <div className="stat-card stat-fav">
              <Heart className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalFavorites}</h3>
                <p>{t.profile.favoriteBooks}</p>
              </div>
            </div>

            <div className="stat-card stat-completed">
              <Package className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.completedLoans}</h3>
                <p>{t.profile.completedLoans}</p>
              </div>
            </div>

            <div className="stat-card stat-reviews">
              <MessageSquare className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalReviews}</h3>
                <p>{t.profile.myReviews}</p>
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
            {t.profile.profileInformation}
          </button>
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} />
            {t.profile.changePassword}
          </button>
          <button
            className={`tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('reviews');
              if (user?.role === ROLES.ADMIN) {
                fetchAllReviews();
              } else {
                fetchUserReviews();
              }
            }}
          >
            <MessageSquare size={18} />
            {user?.role === ROLES.ADMIN ? t.profile.allReviews : t.profile.myReviews}
          </button>
          {user?.role !== ROLES.ADMIN && (
            <button
              className="tab"
              onClick={() => navigate('/late-fees')}
            >
              <span style={{ fontSize: '18px' }}>₺</span>
              {t.profile.lateReturnFees}
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <h2 className="dark:text-white">{t.profile.updateProfileInfo}</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>{t.profile.firstName}</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                    placeholder={t.auth.firstNamePlaceholder}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>{t.profile.lastName}</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                    placeholder={t.auth.lastNamePlaceholder}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.profile.email}</label>
                <input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.profile.tcIdentity}</label>
                <input
                  type="text"
                  value={profileData.tcIdentity}
                  disabled
                  className="disabled-input"
                  style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                />
                <small className="text-gray-600 dark:text-gray-400" style={{ fontSize: '0.875rem', marginTop: '4px', display: 'block' }}>
                  {language === 'tr' ? 'TC Kimlik Numarası değiştirilemez' : 'TC Identity Number cannot be changed'}
                </small>
              </div>

              <div className="form-group">
                <label>{t.profile.phoneNumber}</label>
                <input
                  type="tel"
                  value={profileData.phoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setProfileData({ ...profileData, phoneNumber: formatted });
                  }}
                  placeholder={t.auth.phoneNumberPlaceholder}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.profile.address}</label>
                <textarea
                  value={profileData.address}
                  onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                  placeholder={t.auth.addressPlaceholder}
                  rows="5"
                  required
                  style={{ minHeight: '120px', resize: 'vertical' }}
                />
              </div>

              <div className="form-group">
                <label>{t.profile.birthDate}</label>
                <input
                  type="date"
                  value={profileData.birthDate}
                  onChange={(e) => setProfileData({ ...profileData, birthDate: e.target.value })}
                  max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-actions">
                <Button type="submit" color="primary">
                  {t.profile.update}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <h2 className="dark:text-white">{t.profile.changePassword}</h2>

              <div className="form-group">
                <label>{t.profile.currentPassword}</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>{t.profile.newPassword}</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>{t.profile.confirmNewPassword}</label>
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
                  {t.profile.changePasswordButton}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-section">
              <h2>{user?.role === ROLES.ADMIN ? t.profile.allReviews : t.profile.myReviews}</h2>

              {reviewsLoading ? (
                <div className="loading-message">{t.profile.loadingReviews}</div>
              ) : userReviews.length === 0 ? (
                <div className="empty-message">
                  <MessageSquare size={48} />
                  <p>{user?.role === ROLES.ADMIN ? t.profile.noReviewsYet : t.profile.noReviewsWritten}</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {userReviews.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <div className="book-info">
                          <BookOpen size={20} />
                          <div>
                            <h3>{review.book?.title || t.profile.bookNotFound}</h3>
                            {user?.role === ROLES.ADMIN && review.user && (
                              <small style={{ color: '#666' }}>
                                {t.profile.user}: {review.user.username} ({review.user.email})
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
                          {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(review.createdAt))}
                        </span>
                        <button
                          className="delete-review-btn"
                          onClick={() => {
                            setConfirmModal({
                              title: `🗑️ ${t.profile.deleteReview}`,
                              message: t.profile.deleteReviewConfirm,
                              confirmText: t.profile.yesDelete,
                              confirmColor: 'bg-red-600 hover:bg-red-700',
                              onConfirm: async () => {
                                try {
                                  await reviewService.deleteReview(review._id);
                                  toast.success(t.profile.reviewDeleted);
                                  if (user?.role === ROLES.ADMIN) {
                                    fetchAllReviews();
                                  } else {
                                    fetchUserReviews();
                                    fetchStats();
                                  }
                                } catch {
                                  toast.error(t.profile.reviewDeleteFailed);
                                } finally {
                                  setConfirmModal(null);
                                }
                              }
                            });
                          }}
                        >
                          {t.general.delete}
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
      {confirmModal && (
        <ConfirmModal
          open={!!confirmModal}
          title={confirmModal?.title}
          message={confirmModal?.message}
          confirmText={confirmModal?.confirmText}
          confirmColor={confirmModal?.confirmColor}
          onConfirm={() => { confirmModal?.onConfirm && confirmModal.onConfirm(); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

export default ProfilePage;
