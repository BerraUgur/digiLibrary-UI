import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { favoriteService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import { Heart, BookOpen } from 'lucide-react';
import '../styles/FavoritesPage.css';

function FavoritesPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, translateCategory, getLocalizedText } = useLanguage();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const data = await favoriteService.list();
        setFavorites(data.favorites || []);
      } catch {
        toast.error(t.favorites?.loadError || 'Favoriler yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchFavorites();
    }
  }, [user, authLoading, navigate, t.favorites?.loadError]);

  const handleRemoveFavorite = async (favoriteId, bookTitle) => {
    try {
      await favoriteService.remove(favoriteId);
      setFavorites(favorites.filter(fav => fav._id !== favoriteId));
      toast.success(t.favorites?.removed || `${bookTitle} favorilerden kaldırıldı`);
    } catch {
      toast.error(t.favorites?.removeError || 'Favori kaldırılamadı');
    }
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading">{t.favorites?.loading || 'Favoriler yükleniyor...'}</div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-container">
        <div className="favorites-header">
          <h1>
            <Heart className="heart-icon" />
            {t.favorites?.title || 'Favori Kitaplarım'}
          </h1>
          <p>{t.favorites?.subtitle || 'Beğendiğiniz kitaplar burada listelenir'}</p>
        </div>

        {favorites.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={64} className="empty-icon" />
            <h2>{t.favorites?.empty || 'Henüz favori kitabınız yok'}</h2>
            <p>{t.favorites?.emptyDesc || 'Kitap detay sayfasından favori ekleyebilirsiniz'}</p>
            <Button color="primary" onClick={() => navigate('/books')}>
              {t.favorites?.browseBooks || 'Kitaplara Göz At'}
            </Button>
          </div>
        ) : (
          <div className="favorites-grid">
            {favorites.map((favorite) => {
              const book = favorite.bookId;
              if (!book) return null;
              
              return (
                <div key={favorite._id} className="favorite-card">
                  <div className="favorite-image">
                    <img
                      src={book.imageUrl || '/book-placeholder.jpg'}
                      alt={getLocalizedText(book, 'title')}
                      onClick={() => navigate(`/books/${book._id}`)}
                      onError={(e) => {
                        e.target.src = '/book-placeholder.jpg';
                      }}
                    />
                  </div>
                  <div className="favorite-info">
                    <span className="favorite-category">{translateCategory(book.category)}</span>
                    <h3 
                      className="favorite-title"
                      onClick={() => navigate(`/books/${book._id}`)}
                      title={getLocalizedText(book, 'title')}
                    >
                      {getLocalizedText(book, 'title')}
                    </h3>
                    <p className="favorite-author">{book.author}</p>
                    <div className="favorite-meta">
                      {typeof book.avgRating === 'number' && (
                        <span>⭐ {book.avgRating}</span>
                      )}
                      <span className={`status ${book.available ? 'available' : 'borrowed'}`}>
                        {book.available ? t.books.available : t.books.borrowed}
                      </span>
                    </div>
                    <div className="favorite-actions">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => navigate(`/books/${book._id}`)}
                      >
                        {t.books.viewDetails || 'Detaylar'}
                      </Button>
                      <Button
                        color="danger"
                        size="sm"
                        onClick={() => handleRemoveFavorite(favorite._id, getLocalizedText(book, 'title'))}
                      >
                        <Heart size={16} />
                        {t.favorites?.remove || 'Kaldır'}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;
