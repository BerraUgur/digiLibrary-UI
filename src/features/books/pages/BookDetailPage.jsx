import { useState, useEffect } from 'react';
import ConfirmModal from '../../../components/UI/modals/ConfirmModal';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService, reviewService, loanService, favoriteService } from '../../../services';
import { ROLES } from '../../../constants/rolesConstants';
import { LOAN_DURATION_DAYS, MS_PER_DAY } from '../../../constants/loanConstants';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import '../styles/BookDetailPage.css';
import remoteLogger from '../../../utils/remoteLogger';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, translateCategory } = useLanguage();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmText, confirmColor, onConfirm }
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewText: '',
    rating: 5
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [favorite, setFavorite] = useState({ isFavorite: false, favoriteId: null, pending: false });
  const [imageModalOpen, setImageModalOpen] = useState(false);

  // Fetch book and reviews
  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      try {
        // Fetch book details
        const bookData = await bookService.getBookById(id);
        setBook(bookData);
        if (bookData && typeof bookData.isFavorite !== 'undefined') {
          setFavorite({ isFavorite: !!bookData.isFavorite, favoriteId: bookData.favoriteId || null, pending: false });
        } else {
          // Fetch favorites list to determine status (fallback)
          if (user) {
            try {
              const favs = await favoriteService.list();
              const match = favs?.favorites?.find(f => f.bookId?._id === id);
              if (match) setFavorite({ isFavorite: true, favoriteId: match._id, pending: false });
            } catch (error) {
              remoteLogger.error('Failed to fetch favorites', { error: error?.message || String(error), stack: error?.stack });
            }
          }
        }

        // Fetch reviews
        try {
          const reviewsData = await reviewService.getBookReviews(id);
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        } catch (revErr) {
          if (revErr?.status === 404) {
            setReviews([]);
          } else {
            remoteLogger.warn('Review fetch error', { error: revErr?.message || String(revErr), stack: revErr?.stack });
          }
        }
      } catch (error) {
        if (error?.status === 404) {
          setBook(null);
        } else {
          remoteLogger.error('Failed to fetch book details', { error: error?.message || String(error), stack: error?.stack });
          toast.error(t.books.fetchDetailError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [id, user, t.books.fetchDetailError]);

  // Borrow book
  const handleBorrowBook = async () => {
    if (!user) {
      toast.error(t.books.mustLoginToBorrow);
      navigate('/login');
      return;
    }
    const dueDate = new Date(Date.now() + LOAN_DURATION_DAYS * MS_PER_DAY).toISOString().slice(0, 10);
    try {
      setBorrowLoading(true);
      await loanService.borrowBook({ bookId: id, dueDate });
      setBook(prev => prev ? { ...prev, available: false } : prev);
      toast.success(t.books.borrowedSuccess);
      // Use navigate to avoid logout
      setTimeout(() => {
        navigate('/my-loans', { replace: true });
      }, 1500);
    } catch (error) {
      remoteLogger.error('Borrow error', { error: error?.message || String(error), stack: error?.stack });
      setBorrowLoading(false);

      // Unpaid debt check
      if (error.message && error.message.includes('Unpaid')) {
        toast.error(error.message, {
          autoClose: 6000,
          style: { fontSize: '15px', fontWeight: '600' }
        });
      }
      else if (error.message && error.message.includes('Only 1 book at a time')) {
        toast.warning(t.books.returnCurrentBook, {
          autoClose: 5000,
          style: { fontSize: '15px' }
        });
      }
      // Ban message check
      else if (error.message && error.message.includes('banned')) {
        toast.error(error.message, { autoClose: 8000, style: { fontSize: '16px' } });
      } else if (error.message && error.message.includes('fetch')) {
        toast.error(t.books.serverConnectionError);
      } else if (error.message && error.message.includes('CORS')) {
        toast.error(t.books.corsError);
      } else {
        toast.error(error.message || t.books.borrowError);
      }
    }
  };

  // Add review
  const handleAddReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error(t.books.mustLoginToReview);
      return;
    }

    const text = newReview.reviewText.trim();
    if (!text) {
      toast.error(t.books.reviewRequired);
      return;
    }

    if (text.length < 10) {
      toast.error(t.books.reviewMinLength);
      return;
    }

    try {
      const review = await reviewService.addReview(id, newReview);
      setReviews([review, ...reviews]);
      setNewReview({ reviewText: '', rating: 5 });
      setShowReviewForm(false);
      toast.success(t.books.reviewAdded);
    } catch (error) {
      toast.error(error.message || t.books.reviewAddError);
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId);
      setReviews(reviews.filter(review => review._id !== reviewId));
      toast.success(t.books.reviewDeleted);
    } catch (error) {
      remoteLogger.error('Delete review error', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.books.reviewDeleteError);
    }
  };

  // Delete all reviews (admin) - open confirmation modal instead of browser confirm
  const handleDeleteAllReviews = async () => {
    if (!user || user.role !== ROLES.ADMIN) return;
    if (!reviews || reviews.length === 0) {
      toast.info(t.books.noReviewsToDelete);
      return;
    }

    setConfirmModal({
      title: '🗑️ Delete All Reviews',
      message: 'Are you sure you want to delete all reviews? This action cannot be undone.',
      confirmText: 'Yes, Delete',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await Promise.all(reviews.map(r => reviewService.deleteReview(r._id)));
          setReviews([]);
          toast.success(t.books.allReviewsDeleted);
          setConfirmModal(null);
        } catch (error) {
          remoteLogger.error('Delete all reviews error', { error: error?.message || String(error), stack: error?.stack });
          toast.error(t.books.allReviewsDeleteError);
          setConfirmModal(null);
        }
      }
    });
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error(t.books.loginToFavorite);
      return;
    }
    if (favorite.pending) return;
    setFavorite(s => ({ ...s, pending: true }));
    try {
      if (!favorite.isFavorite) {
        const res = await favoriteService.add(id);
        setFavorite({ isFavorite: true, favoriteId: res?.favorite?._id || res?.favoriteId || null, pending: false });
        toast.success(t.books.addedToFavorites);
      } else if (favorite.favoriteId) {
        await favoriteService.remove(favorite.favoriteId);
        setFavorite({ isFavorite: false, favoriteId: null, pending: false });
        toast.info(t.books.removedFromFavorites);
      }
    } catch (e) {
      remoteLogger.error('Favorite toggle error', { error: e?.message || String(e), stack: e?.stack });
      toast.error(t.books.favoriteActionFailed);
      setFavorite(s => ({ ...s, pending: false }));
    }
  };

  const reviewLength = newReview.reviewText.trim().length;
  const isReviewValid = reviewLength >= 10;

  if (loading) {
    return (
      <div className="book-detail-page">
        <div className="loading">{t.books.loadingBookDetails}</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="error">{t.books.bookNotFound}</div>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        {/* Back button */}
        <Button
          color="secondary"
          size="sm"
          onClick={() => navigate('/books')}
          className="back-button"
        >
          {t.books.backToBooks}
        </Button>

        {/* Book details */}
        <div className="book-detail">
          <div className="book-image">
            <img
              src={book.imageUrl || '/book-placeholder.jpg'}
              alt={book.title}
              role="button"
              tabIndex={0}
              onClick={() => setImageModalOpen(true)}
              onError={(e) => {
                e.target.src = '/book-placeholder.jpg';
              }}
            />
          </div>

          <div className="book-info">
            <h1 className="book-title">{book.title}</h1>
            <p className="book-author">{t.books.authorLabel} {book.author}</p>
            <p className="book-category">{t.books.categoryLabel} {translateCategory(book.category)}</p>
            <p className="book-status">
              {t.books.statusLabel} {book.available ? t.books.available : t.books.borrowed}
            </p>
            <div className="book-stats flex items-center gap-4 mt-2 text-sm text-gray-600">
              {typeof book.avgRating === 'number' && (
                <span title={t.books.averageRatingTitle}>⭐ {book.avgRating}</span>
              )}
              <span title={t.books.numberOfReviewsTitle}>💬 {reviews.length}</span>
              {user?.role !== ROLES.ADMIN && (
                <button
                  onClick={toggleFavorite}
                  disabled={favorite.pending}
                  className={`favorite-toggle ${favorite.isFavorite ? 'active' : ''}`}
                  aria-label={favorite.isFavorite ? t.books.removeFromFavoritesLabel : t.books.addToFavoritesLabel}
                >
                  {favorite.isFavorite ? t.books.favorited : t.books.addToFavorite}
                </button>
              )}
            </div>

            {user?.role === ROLES.ADMIN ? (
              <Button
                color="warning"
                size="lg"
                onClick={() => navigate(`/books/${book._id}/edit`)}
                className="edit-button"
              >
                {t.books.editBookButton}
              </Button>
            ) : book.available && (
              <Button
                color="success"
                size="lg"
                onClick={handleBorrowBook}
                disabled={borrowLoading}
                className="borrow-button"
              >
                {borrowLoading ? t.books.processing : t.books.borrowBook}
              </Button>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>{t.books.reviewsTitle} ({reviews.length})</h2>
            {user?.role === ROLES.ADMIN ? (
              <Button
                color="danger"
                size="sm"
                onClick={handleDeleteAllReviews}
              >
                {t.books.deleteAllReviews}
              </Button>
            ) : user ? (
              <Button
                color="primary"
                size="sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? t.books.cancelReview : t.books.addReview}
              </Button>
            ) : null}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <form onSubmit={handleAddReview} className="review-form">
              <div className="rating-input">
                <label>{t.books.ratingLabel}</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview(prev => ({ ...prev, rating: Number(e.target.value) }))}
                >
                  <option value={5}>{t.books.ratingExcellent}</option>
                  <option value={4}>{t.books.ratingVeryGood}</option>
                  <option value={3}>{t.books.ratingGood}</option>
                  <option value={2}>{t.books.ratingFair}</option>
                  <option value={1}>{t.books.ratingPoor}</option>
                </select>
              </div>

              <div className="review-text-input">
                <label>{t.books.reviewLabel}</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                  placeholder={t.books.reviewPlaceholder}
                  rows="4"
                  required
                />
                <div className="review-help" style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                  {t.books.reviewMinChars} ({reviewLength}/10)
                </div>
              </div>

              <div className="form-actions">
                <Button type="submit" color="success" disabled={!isReviewValid}>
                  {t.books.submitReview}
                </Button>
              </div>
            </form>
          )}

          {/* Review list */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">{t.books.noReviewsYet}</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <strong>{review.user?.username || t.books.anonymous}</strong>
                      <span className="review-rating">
                        {'⭐'.repeat(review.rating)}
                      </span>
                    </div>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>

                  <p className="review-text">{review.reviewText}</p>

                  {(user?._id === review.user?._id || user?.role === ROLES.ADMIN) && (
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => setConfirmModal({
                        title: t.books.deleteReviewTitle,
                        message: `${t.books.deleteReviewMessage} ${review.user?.username || t.books.anonymous}?`,
                        confirmText: t.books.deleteReviewConfirm,
                        confirmColor: 'bg-red-600 hover:bg-red-700',
                        onConfirm: async () => {
                          try {
                            await handleDeleteReview(review._id);
                          } finally {
                            setConfirmModal(null);
                          }
                        }
                      })}
                      className="delete-review-btn"
                    >
                      {t.general.delete}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Confirmation Modal for Delete All Reviews */}
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

        {/* Inline image modal (previously a shared component) */}
        {imageModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4">
            <div className="relative max-w-[95%] max-h-[95%]">
              <button
                onClick={() => setImageModalOpen(false)}
                className="absolute top-2 right-2 text-white bg-black bg-opacity-40 rounded-full p-2 hover:bg-opacity-60"
                aria-label="Close image"
              >
                {/* Close icon - small X */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 L6 18" /><path d="M6 6 L18 18" /></svg>
              </button>

              <img
                src={book.imageUrl || '/book-placeholder.jpg'}
                alt={book.title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                  display: 'block',
                  margin: '0 auto',
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );

}

export default BookDetailPage;
