import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { bookService, reviewService, loanService, favoriteService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Button from '../components/UI/Button';
import './BookDetailPage.css';

function BookDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [book, setBook] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [borrowLoading, setBorrowLoading] = useState(false);
  const [newReview, setNewReview] = useState({
    reviewText: '',
    rating: 5
  });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [favorite, setFavorite] = useState({ isFavorite: false, favoriteId: null, pending: false });

  // Kitap ve değerlendirmeleri getir
  useEffect(() => {
    const fetchBookData = async () => {
      setLoading(true);
      try {
        // Kitabı ayrı çek
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
            } catch { /* ignore */ }
          }
        }

        // Yorumları ayrı dene; 404 ise boş liste kabul et
        try {
          const reviewsData = await reviewService.getBookReviews(id);
          setReviews(Array.isArray(reviewsData) ? reviewsData : []);
        } catch (revErr) {
          if (revErr?.status === 404) {
            setReviews([]);
          } else {
            console.warn('Review fetch error:', revErr);
          }
        }
      } catch (error) {
        if (error?.status === 404) {
          setBook(null);
        } else {
          toast.error('Kitap bilgileri yüklenirken bir hata oluştu');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchBookData();
  }, [id, user]);

  // Kitap ödünç alma
  const handleBorrowBook = async () => {
    if (!user) {
      toast.error('Kitap ödünç almak için giriş yapmalısınız');
      navigate('/login');
      return;
    }
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    try {
      setBorrowLoading(true);
      await loanService.borrowBook({ bookId: id, dueDate });
      setBook(prev => prev ? { ...prev, available: false } : prev);
      toast.success('Kitap başarıyla ödünç alındı! Ödünç aldığım kitaplara yönlendiriliyorsunuz...');
      // LOGOUT YAPMASIN DİYE navigate kullan
      setTimeout(() => {
        navigate('/my-loans', { replace: true });
      }, 1500);
    } catch (error) {
      console.error('Borrow error:', error);
      setBorrowLoading(false);
      
      // Ödenmemiş borç kontrolü
      if (error.message && error.message.includes('Ödenmemiş')) {
        toast.error(error.message, { 
          autoClose: 6000, 
          style: { fontSize: '15px', fontWeight: '600' }
        });
      }
      // 1 kitap limiti kontrolü
      else if (error.message && error.message.includes('Aynı anda sadece 1 kitap')) {
        toast.warning('📚 Yeni kitap almak için mevcut ödünç aldığınız kitabı iade ediniz!', {
          autoClose: 5000,
          style: { fontSize: '15px' }
        });
      }
      // Ban mesajı kontrolü
      else if (error.message && error.message.includes('yasaklı')) {
        toast.error(error.message, { autoClose: 8000, style: { fontSize: '16px' } });
      } else if (error.message && error.message.includes('fetch')) {
        toast.error('Sunucuya bağlanılamadı. Lütfen backend sunucusunun çalıştığından emin olun.');
      } else if (error.message && error.message.includes('CORS')) {
        toast.error('CORS hatası. Backend sunucusunu yeniden başlatın.');
      } else {
        toast.error(error.message || 'Kitap ödünç alınırken bir hata oluştu');
      }
    }
  };

  // Değerlendirme ekleme
  const handleAddReview = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Değerlendirme eklemek için giriş yapmalısınız');
      return;
    }

    if (!newReview.reviewText.trim()) {
      toast.error('Değerlendirme metni gereklidir');
      return;
    }

    try {
      const review = await reviewService.addReview(id, newReview);
      setReviews([review, ...reviews]);
      setNewReview({ reviewText: '', rating: 5 });
      setShowReviewForm(false);
      toast.success('Değerlendirme başarıyla eklendi!');
    } catch (error) {
      toast.error(error.message || 'Değerlendirme eklenirken bir hata oluştu');
    }
  };

  // Değerlendirme silme
  const handleDeleteReview = async (reviewId) => {
    try {
      await reviewService.deleteReview(reviewId);
      setReviews(reviews.filter(review => review._id !== reviewId));
      toast.success('Değerlendirme silindi');
    } catch (error) {
      console.error('Delete review error:', error);
      toast.error('Değerlendirme silinirken bir hata oluştu');
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Favorilere eklemek için giriş yapmalısınız');
      return;
    }
    if (favorite.pending) return;
    setFavorite(s => ({ ...s, pending: true }));
    try {
      if (!favorite.isFavorite) {
        const res = await favoriteService.add(id);
        setFavorite({ isFavorite: true, favoriteId: res?.favorite?._id || res?.favoriteId || null, pending: false });
        toast.success('Favorilere eklendi');
      } else if (favorite.favoriteId) {
        await favoriteService.remove(favorite.favoriteId);
        setFavorite({ isFavorite: false, favoriteId: null, pending: false });
        toast.info('Favoriden çıkarıldı');
      }
    } catch (e) {
      console.error('Favorite toggle error:', e);
      toast.error('Favori işlemi başarısız');
      setFavorite(s => ({ ...s, pending: false }));
    }
  };

  if (loading) {
    return (
      <div className="book-detail-page">
        <div className="loading">Kitap bilgileri yükleniyor...</div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="error">Kitap bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        {/* Geri dön butonu */}
        <Button 
          color="secondary" 
          size="sm" 
          onClick={() => navigate('/books')}
          className="back-button"
        >
          ← Kitaplara Dön
        </Button>

        {/* Kitap bilgileri */}
        <div className="book-detail">
          <div className="book-image">
            <img 
              src={book.imageUrl || '/book-placeholder.jpg'} 
              alt={book.title}
              onError={(e) => {
                e.target.src = '/book-placeholder.jpg';
              }}
            />
          </div>
          
          <div className="book-info">
            <h1 className="book-title">{book.title}</h1>
            <p className="book-author">Yazar: {book.author}</p>
            <p className="book-category">Kategori: {book.category}</p>
            <p className="book-status">
              Durum: {book.available ? 'Mevcut' : 'Ödünç Alınmış'}
            </p>
            <div className="book-stats flex items-center gap-4 mt-2 text-sm text-gray-600">
              {typeof book.avgRating === 'number' && (
                <span title="Ortalama Puan">⭐ {book.avgRating}</span>
              )}
              <span title="Yorum Sayısı">💬 {reviews.length}</span>
              {user?.role !== 'admin' && (
                <button
                  onClick={toggleFavorite}
                  disabled={favorite.pending}
                  className={`favorite-toggle ${favorite.isFavorite ? 'active' : ''}`}
                  aria-label={favorite.isFavorite ? 'Favoriden çıkar' : 'Favoriye ekle'}
                >
                  {favorite.isFavorite ? '★ Favori' : '☆ Favori'}
                </button>
              )}
            </div>
            
            {user?.role === 'admin' ? (
              <Button
                color="warning"
                size="lg"
                onClick={() => navigate(`/books/${book._id}/edit`)}
                className="edit-button"
              >
                Kitabı Düzenle
              </Button>
            ) : book.available && (
              <Button
                color="success"
                size="lg"
                onClick={handleBorrowBook}
                disabled={borrowLoading}
                className="borrow-button"
              >
                {borrowLoading ? 'İşleniyor...' : 'Kitabı Ödünç Al'}
              </Button>
            )}
          </div>
        </div>

        {/* Değerlendirmeler */}
        <div className="reviews-section">
          <div className="reviews-header">
            <h2>Değerlendirmeler ({reviews.length})</h2>
            {user && (
              <Button
                color="primary"
                size="sm"
                onClick={() => setShowReviewForm(!showReviewForm)}
              >
                {showReviewForm ? 'İptal' : 'Değerlendirme Ekle'}
              </Button>
            )}
          </div>

          {/* Değerlendirme formu */}
          {showReviewForm && (
            <form onSubmit={handleAddReview} className="review-form">
              <div className="rating-input">
                <label>Puan:</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview(prev => ({ ...prev, rating: Number(e.target.value) }))}
                >
                  <option value={5}>5 - Mükemmel</option>
                  <option value={4}>4 - Çok İyi</option>
                  <option value={3}>3 - İyi</option>
                  <option value={2}>2 - Orta</option>
                  <option value={1}>1 - Kötü</option>
                </select>
              </div>
              
              <div className="review-text-input">
                <label>Değerlendirme:</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview(prev => ({ ...prev, reviewText: e.target.value }))}
                  placeholder="Kitap hakkında düşüncelerinizi yazın..."
                  rows="4"
                  required
                />
              </div>
              
              <Button type="submit" color="success">
                Değerlendirme Gönder
              </Button>
            </form>
          )}

          {/* Değerlendirme listesi */}
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <p className="no-reviews">Henüz değerlendirme yapılmamış.</p>
            ) : (
              reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <div className="review-user">
                      <strong>{review.user?.username || 'Anonim'}</strong>
                      <span className="review-rating">
                        {'⭐'.repeat(review.rating)}
                      </span>
                    </div>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  
                  <p className="review-text">{review.reviewText}</p>
                  
                  {(user?._id === review.user?._id || user?.role === 'admin') && (
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => handleDeleteReview(review._id)}
                      className="delete-review-btn"
                    >
                      Sil
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BookDetailPage; 