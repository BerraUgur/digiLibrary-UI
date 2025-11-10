import { useState, useEffect } from 'react';
import ConfirmModal from '../../../components/UI/modals/ConfirmModal';
import BookDetailSkeleton from '../../../components/UI/skeleton/BookDetailSkeleton';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService, reviewService, loanService, favoriteService } from '../../../services';
import { ROLES } from '../../../constants/rolesConstants';
import { LOAN_DURATION_DAYS, MS_PER_DAY } from '../../../constants/loanConstants';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import { formatDate } from '../../../utils/dateFormatter';
import '../styles/BookDetailPage.css';
import remoteLogger from '../../../utils/remoteLogger';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, translateCategory, getLocalizedText } = useLanguage();

  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [confirmModal, setConfirmModal] = useState(null); // { title, message, confirmText, confirmColor, onConfirm }
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewText: '',
    rating: 5
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [favorite, setFavorite] = useState({ isFavorite: false, favoriteId: null, pending: false });
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [similarBooks, setSimilarBooks] = useState([]);

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

        // Fetch similar books (same category, exclude current book)
        if (bookData?.category) {
          try {
            const allBooks = await bookService.getAllBooks();
            const bookCategories = Array.isArray(bookData.category) ? bookData.category : [bookData.category];
            const similar = allBooks
              .filter(b => {
                if (b._id === id) return false;
                const categories = Array.isArray(b.category) ? b.category : [b.category];
                return categories.some(cat => bookCategories.includes(cat));
              })
              .slice(0, 6); // Max 6 similar books
            setSimilarBooks(similar);
          } catch (error) {
            remoteLogger.warn('Failed to fetch similar books', { error: error?.message || String(error), stack: error?.stack });
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
    
    // Show confirmation modal directly
    setShowBorrowModal(true);
  };

  const confirmBorrow = async () => {
    setShowBorrowModal(false);
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

      // Check for specific error types (already translated by http.js)
      const errorMsg = error.message || t.books.borrowError;
      
      // Unpaid debt check (works for both English and Turkish messages)
      if (errorMsg.includes('unpaid') || errorMsg.includes('ödenmemiş') || errorMsg.includes('Unpaid')) {
        toast.error(errorMsg, {
          autoClose: 6000,
          style: { fontSize: '15px', fontWeight: '600' }
        });
      }
      // Multiple books check
      else if (errorMsg.includes('only borrow') || errorMsg.includes('sadece') || errorMsg.includes('aynı anda')) {
        toast.warning(errorMsg, {
          autoClose: 5000,
          style: { fontSize: '15px' }
        });
      }
      // Ban message check
      else if (errorMsg.includes('banned') || errorMsg.includes('yasaklandı') || errorMsg.includes('ban')) {
        toast.error(errorMsg, { autoClose: 8000, style: { fontSize: '16px' } });
      } else if (errorMsg.includes('fetch') || errorMsg.includes('Bağlantı')) {
        toast.error(t.books.serverConnectionError);
      } else if (errorMsg.includes('CORS')) {
        toast.error(t.books.corsError);
      } else {
        toast.error(errorMsg);
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
      // Check if error is about borrowing permission
      if (error.message && (error.message.includes('borrowed') || error.message.includes('ödünç'))) {
        toast.warning(t.books.mustBorrowToReview || 'Bu kitap için yorum yapabilmek için önce ödünç alıp iade etmelisiniz.', {
          autoClose: 6000
        });
      } else {
        toast.error(error.message || t.books.reviewAddError);
      }
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
    return <BookDetailSkeleton />;
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
              alt={getLocalizedText(book, 'title')}
              role="button"
              tabIndex={0}
              onClick={() => setImageModalOpen(true)}
              onError={(e) => {
                e.target.src = '/book-placeholder.jpg';
              }}
            />
          </div>

          <div className="book-info">
            <h1 className="book-title">{getLocalizedText(book, 'title')}</h1>
            <p className="book-author">
              {t.books.authorLabel} {Array.isArray(book.author) ? book.author.join(', ') : book.author}
            </p>
            <p className="book-category">
              {t.books.categoryLabel} {Array.isArray(book.category) 
                ? book.category.map(translateCategory).join(', ') 
                : translateCategory(book.category)}
            </p>
            <p className={`book-status ${book.available ? 'status-available' : 'status-borrowed'}`}>
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

        {/* Description Section */}
        {getLocalizedText(book, 'description') && (
          <div className="reviews-section">
            <h2 className="text-2xl font-semibold mb-4">{t.books.description || 'Description'}</h2>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md">
              <p className="text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap break-words">
                {getLocalizedText(book, 'description')}
              </p>
            </div>
          </div>
        )}

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
                      {formatDate(review.createdAt)}
                    </span>
                  </div>

                  <p className="review-text">{review.reviewText}</p>

                  {(user?._id === review.user?._id || user?.role === ROLES.ADMIN) && (
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => setConfirmModal({
                        title: t.books.deleteReviewTitle,
                        message: t.books.deleteReviewMessage,
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

        {/* Similar Books Section */}
        {similarBooks.length > 0 && (
          <div className="similar-books-section">
            <h2>{t.books.similarBooks || 'Benzer Kitaplar'}</h2>
            <div className="similar-books-grid">
              {similarBooks.map((similarBook) => (
                <div 
                  key={similarBook._id} 
                  className="similar-book-card"
                  onClick={() => navigate(`/books/${similarBook._id}`)}
                >
                  <img
                    src={similarBook.imageUrl || '/book-placeholder.jpg'}
                    alt={getLocalizedText(similarBook, 'title')}
                    onError={(e) => {
                      e.target.src = '/book-placeholder.jpg';
                    }}
                  />
                  <div className="similar-book-info">
                    <h4 className="line-clamp-2" title={getLocalizedText(similarBook, 'title')}>
                      {getLocalizedText(similarBook, 'title')}
                    </h4>
                    <p className="similar-book-author">
                      {Array.isArray(similarBook.author) ? similarBook.author.join(', ') : similarBook.author}
                    </p>
                    <div className="similar-book-meta">
                      {typeof similarBook.avgRating === 'number' && (
                        <span>⭐ {similarBook.avgRating}</span>
                      )}
                      <span className={`similar-book-status ${similarBook.available ? 'available' : 'borrowed'}`}>
                        {similarBook.available ? t.books.available : t.books.borrowed}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Borrow Confirmation Modal */}
        {showBorrowModal && (
          <ConfirmModal
            open={showBorrowModal}
            onCancel={() => setShowBorrowModal(false)}
            onConfirm={confirmBorrow}
            title={t.books.confirmBorrowTitle || 'Kitabı Ödünç Al'}
            message={t.books.confirmBorrowMessage || `"${getLocalizedText(book, 'title')}" kitabını ${LOAN_DURATION_DAYS} gün süreyle ödünç almak istediğinize emin misiniz?`}
            confirmText={t.books.confirmBorrow || 'Evet, Ödünç Al'}
            cancelText={t.general.cancel || 'İptal'}
            confirmColor="bg-green-600 hover:bg-green-700"
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
                alt={getLocalizedText(book, 'title')}
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
