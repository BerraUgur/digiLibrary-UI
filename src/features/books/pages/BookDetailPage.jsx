import { useState, useEffect } from 'react';
import ConfirmModal from '../../../components/UI/modals/ConfirmModal';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService, reviewService, loanService, favoriteService } from '../../../services';
import { ROLES } from '../../../constants/rolesConstants';
import { LOAN_DURATION_DAYS, MS_PER_DAY } from '../../../constants/loanConstants';
import { useAuth } from '../../auth/context/useAuth';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import '../styles/BookDetailPage.css';
import remoteLogger from '../../../utils/remoteLogger';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

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
          toast.error('Failed to fetch book details.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [id, user]);

  // Borrow book
  const handleBorrowBook = async () => {
    if (!user) {
      toast.error('You must be logged in to borrow a book');
      navigate('/login');
      return;
    }
    const dueDate = new Date(Date.now() + LOAN_DURATION_DAYS * MS_PER_DAY).toISOString().slice(0, 10);
    try {
      setBorrowLoading(true);
      await loanService.borrowBook({ bookId: id, dueDate });
      setBook(prev => prev ? { ...prev, available: false } : prev);
      toast.success('Book borrowed successfully! Redirecting to your borrowed books...');
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
        toast.warning('📚 To borrow a new book, please return the currently borrowed book!', {
          autoClose: 5000,
          style: { fontSize: '15px' }
        });
      }
      // Ban message check
      else if (error.message && error.message.includes('banned')) {
        toast.error(error.message, { autoClose: 8000, style: { fontSize: '16px' } });
      } else if (error.message && error.message.includes('fetch')) {
        toast.error('Unable to connect to the server. Please ensure the backend server is running.');
      } else if (error.message && error.message.includes('CORS')) {
        toast.error('CORS error. Please restart the backend server.');
      } else {
        toast.error(error.message || 'An error occurred while borrowing the book');
      }
    }
  };

  // Add review
  const handleAddReview = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('You must be logged in to add a review');
      return;
    }

    const text = newReview.reviewText.trim();
    if (!text) {
      toast.error('Review text is required');
      return;
    }

    if (text.length < 10) {
      toast.error('Review must be at least 10 characters long');
      return;
    }

    try {
      const review = await reviewService.addReview(id, newReview);
      setReviews([review, ...reviews]);
      setNewReview({ reviewText: '', rating: 5 });
      setShowReviewForm(false);
      toast.success('Review added successfully!');
    } catch (error) {
      toast.error(error.message || 'An error occurred while adding the review');
    }
  };

  // Delete review
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId);
      setReviews(reviews.filter(review => review._id !== reviewId));
      toast.success('Review deleted');
    } catch (error) {
      remoteLogger.error('Delete review error', { error: error?.message || String(error), stack: error?.stack });
      toast.error('An error occurred while deleting the review');
    }
  };

  // Delete all reviews (admin) - open confirmation modal instead of browser confirm
  const handleDeleteAllReviews = async () => {
    if (!user || user.role !== ROLES.ADMIN) return;
    if (!reviews || reviews.length === 0) {
      toast.info('No reviews to delete');
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
          toast.success('All reviews deleted');
          setConfirmModal(null);
        } catch (error) {
          remoteLogger.error('Delete all reviews error', { error: error?.message || String(error), stack: error?.stack });
          toast.error('An error occurred while deleting all reviews');
          setConfirmModal(null);
        }
      }
    });
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('You must be logged in to add to favorites');
      return;
    }
    if (favorite.pending) return;
    setFavorite(s => ({ ...s, pending: true }));
    try {
      if (!favorite.isFavorite) {
        const res = await favoriteService.add(id);
        setFavorite({ isFavorite: true, favoriteId: res?.favorite?._id || res?.favoriteId || null, pending: false });
        toast.success('Added to favorites');
      } else if (favorite.favoriteId) {
        await favoriteService.remove(favorite.favoriteId);
        setFavorite({ isFavorite: false, favoriteId: null, pending: false });
        toast.info('Removed from favorites');
      }
    } catch (e) {
      remoteLogger.error('Favorite toggle error', { error: e?.message || String(e), stack: e?.stack });
      toast.error('Favorite action failed');
      setFavorite(s => ({ ...s, pending: false }));
    }
  };

  const reviewLength = newReview.reviewText.trim().length;
  const isReviewValid = reviewLength >= 10;

  if (loading) {
    return (
      <div className="book-detail-page">
        <div className="loading">Loading book details...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="error">Book not found</div>
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
          ← Back to Books
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
            <p className="book-author">Author: {book.author}</p>
            <p className="book-category">Category: {book.category}</p>
            <p className="book-status">
              Status: {book.available ? 'Available' : 'Borrowed'}
            </p>
            <div className="book-stats flex items-center gap-4 mt-2 text-sm text-gray-600">
              {typeof book.avgRating === 'number' && (
                <span title="Average Rating">⭐ {book.avgRating}</span>
              )}
              <span title="Number of Reviews">💬 {reviews.length}</span>
              {user?.role !== ROLES.ADMIN && (
                <button
                  onClick={toggleFavorite}
                  disabled={favorite.pending}
                  className={`favorite-toggle ${favorite.isFavorite ? 'active' : ''}`}
                  aria-label={favorite.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favorite.isFavorite ? '★ Favorite' : '☆ Favorite'}
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
                Edit Book
              </Button>
            ) : book.available && (
              <Button
                color="success"
                size="lg"
                onClick={handleBorrowBook}
                disabled={borrowLoading}
                className="borrow-button"
              >
                {borrowLoading ? 'Processing...' : 'Borrow Book'}
              </Button>
            )}
          </div>
        </div>

        {/* Reviews */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>Reviews ({reviews.length})</h2>
            {user?.role === ROLES.ADMIN ? (
              <Button
                color="danger"
                size="sm"
                onClick={handleDeleteAllReviews}
              >
                Delete All Reviews
              </Button>
            ) : user ? (
              <Button
                color="primary"
                size="sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? 'Cancel' : 'Add Review'}
              </Button>
            ) : null}
          </div>

          {/* Review form */}
          {showReviewForm && (
            <form onSubmit={handleAddReview} className="review-form">
              <div className="rating-input">
                <label>Rating:</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview(prev => ({ ...prev, rating: Number(e.target.value) }))}
                >
                  <option value={5}>5 - Excellent</option>
                  <option value={4}>4 - Very Good</option>
                  <option value={3}>3 - Good</option>
                  <option value={2}>2 - Fair</option>
                  <option value={1}>1 - Poor</option>
                </select>
              </div>

              <div className="review-text-input">
                <label>Review:</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                  placeholder="Share your thoughts about the book..."
                  rows="4"
                  required
                />
                <div className="review-help" style={{ marginTop: '6px', fontSize: '12px', color: '#666' }}>
                  Minimum 10 characters ({reviewLength}/10)
                </div>
              </div>

              <div className="form-actions">
                <Button type="submit" color="success" disabled={!isReviewValid}>
                  Submit Review
                </Button>
              </div>
            </form>
          )}

          {/* Review list */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <strong>{review.user?.username || 'Anonymous'}</strong>
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
                        title: '🗑️ Delete Review',
                        message: `Are you sure you want to delete this review by ${review.user?.username || 'this user'}?`,
                        confirmText: 'Delete',
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
                      Delete
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
