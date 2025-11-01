import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { userService, loanService, favoriteService, reviewService } from '../../../services';
import { toast } from 'react-toastify';
import { User, Lock, BookOpen, Heart, Package, MessageSquare } from 'lucide-react';
import ConfirmModal from '../../../components/UI/modals/ConfirmModal';
import Button from '../../../components/UI/buttons/Button';
import { ROLES } from '../../../constants/rolesConstants';
import '../styles/ProfilePage.css';
import remoteLogger from '../../../utils/remoteLogger';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
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
      setProfileData({
        username: data.username || '',
        email: data.email || '',
      });
      setStats(prev => ({
        ...prev,
        // Format as DD.MM.YYYY
        memberSince: new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(data.createdAt)),
      }));
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
    try {
      await userService.updateProfile(profileData);
      toast.success(t.profile.profileUpdated);
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
    return (
      <div className="profile-page">
        <div className="loading">{t.profile.loading}</div>
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
              {user?.role === ROLES.ADMIN ? `👑 ${t.profile.admin}` : `📚 ${t.profile.member}`}
            </p>
            <p className="user-member-since">
              📅 {t.profile.memberSinceLabel} {stats.memberSince}
            </p>
          </div>
        </div>

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
              <h2>{t.profile.updateProfileInfo}</h2>

              <div className="form-group">
                <label>{t.profile.username}</label>
                <input
                  type="text"
                  value={profileData.username}
                  onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                  required
                />
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

              <div className="form-actions">
                <Button type="submit" color="primary">
                  {t.profile.update}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <h2>{t.profile.changePassword}</h2>

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
