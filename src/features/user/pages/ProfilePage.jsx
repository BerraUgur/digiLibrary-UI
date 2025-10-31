import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/useAuth';
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
      toast.error('Failed to load profile information.');
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
      toast.error('Error occurred while loading reviews.');
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
      toast.error('Error occurred while loading reviews.');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await userService.updateProfile(profileData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Error occurred while updating profile.');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match!');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long!');
      return;
    }

    try {
      await userService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      toast.error(error.message || 'Failed to change password.');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
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
              {user?.role === ROLES.ADMIN ? '👑 Admin' : '📚 Member'}
            </p>
            <p className="user-member-since">
              📅 Member Since: {stats.memberSince}
            </p>
          </div>
        </div>

        {/* Stats Cards - Different for Admin and Regular Users */}
        {user?.role === ROLES.ADMIN ? (
          <div className="admin-dashboard-info">
            <div className="admin-welcome-card">
              <h2>👑 Admin Panel</h2>
              <p>Welcome to the DigiLibrary management panel! Manage all operations from here.</p>

              <div className="admin-quick-links">
                <button
                  onClick={() => navigate('/books')}
                  className="quick-link-btn"
                >
                  📚 Manage Books
                </button>
                <button
                  onClick={() => navigate('/admin/loans')}
                  className="quick-link-btn"
                >
                  📦 Manage Loans
                </button>
                <button
                  onClick={() => navigate('/admin/users')}
                  className="quick-link-btn"
                >
                  👥 Manage Users
                </button>
                <button
                  onClick={() => navigate('/admin/messages')}
                  className="quick-link-btn"
                >
                  💬 Messages
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
                <p>Active Loans</p>
              </div>
            </div>

            <div className="stat-card">
              <Heart className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalFavorites}</h3>
                <p>Favorite Books</p>
              </div>
            </div>

            <div className="stat-card">
              <Package className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.completedLoans}</h3>
                <p>Completed Loans</p>
              </div>
            </div>

            <div className="stat-card">
              <MessageSquare className="stat-icon" />
              <div className="stat-content">
                <h3>{stats.totalReviews}</h3>
                <p>My Reviews</p>
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
            Profile Information
          </button>
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <Lock size={18} />
            Change Password
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
            {user?.role === ROLES.ADMIN ? 'All Reviews' : 'My Reviews'}
          </button>
          {user?.role !== ROLES.ADMIN && (
            <button
              className="tab"
              onClick={() => navigate('/late-fees')}
            >
              <span style={{ fontSize: '18px' }}>₺</span>
              Late Return Fees
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="profile-form">
              <h2>Update Profile Information</h2>

              <div className="form-group">
                <label>Username</label>
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
                  Update
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="profile-form">
              <h2>Change Password</h2>

              <div className="form-group">
                <label>Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div className="form-group">
                <label>Confirm New Password</label>
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
                  Change Password
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'reviews' && (
            <div className="reviews-section">
              <h2>{user?.role === ROLES.ADMIN ? 'All Reviews' : 'My Reviews'}</h2>

              {reviewsLoading ? (
                <div className="loading-message">Loading reviews...</div>
              ) : userReviews.length === 0 ? (
                <div className="empty-message">
                  <MessageSquare size={48} />
                  <p>{user?.role === ROLES.ADMIN ? 'No reviews yet.' : 'You have not written any reviews yet.'}</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {userReviews.map((review) => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <div className="book-info">
                          <BookOpen size={20} />
                          <div>
                            <h3>{review.book?.title || 'Book not found'}</h3>
                            {user?.role === ROLES.ADMIN && review.user && (
                              <small style={{ color: '#666' }}>
                                User: {review.user.username} ({review.user.email})
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
                              title: '🗑️ Delete Review',
                              message: 'Are you sure you want to delete this review?',
                              confirmText: 'Yes, Delete',
                              confirmColor: 'bg-red-600 hover:bg-red-700',
                              onConfirm: async () => {
                                try {
                                  await reviewService.deleteReview(review._id);
                                  toast.success('Review deleted');
                                  if (user?.role === ROLES.ADMIN) {
                                    fetchAllReviews();
                                  } else {
                                    fetchUserReviews();
                                    fetchStats();
                                  }
                                } catch {
                                  toast.error('Failed to delete review.');
                                } finally {
                                  setConfirmModal(null);
                                }
                              }
                            });
                          }}
                        >
                          Delete
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
