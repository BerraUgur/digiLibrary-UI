import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../UI/Button";
import { useAuth } from "../../context/AuthContext";
import { loanService } from "../../services/api";
import { toast } from "react-toastify";
import "./BookItem.css";

function BookItem({ book, onDeleteBook }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Kitap ödünç alma
  const handleBorrowBook = async () => {
    if (!user) {
      toast.error('Kitap ödünç almak için giriş yapmalısınız');
      navigate('/login');
      return;
    }

    // 14 gün sonrası otomatik dueDate
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    try {
      setLoading(true);
      console.log('Borrowing book:', { bookId: book._id, dueDate });
      await loanService.borrowBook({ bookId: book._id, dueDate });
      toast.success('Kitap başarıyla ödünç alındı! Ödünç aldığım kitaplar sayfasına yönlendiriliyorsunuz...');
      // LOGOUT YAPMASIN DİYE window.location.reload() KULLANMIYORUZ!
      // Navigate ile yönlendir - bu logout yapmaz
      setTimeout(() => {
        navigate('/my-loans', { replace: true });
      }, 1500);
    } catch (error) {
      console.error('Borrow error:', error);
      setLoading(false);
      
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

  // Kitap detayına git
  const handleViewDetails = () => {
    navigate(`/books/${book._id}`);
  };

  // Kitap silme (sadece admin)
  const handleDeleteBook = async () => {
    console.log('User role:', user?.role);
    console.log('User data:', user);
    
    if (user?.role === 'admin') {
      try {
        await onDeleteBook(book._id);
      } catch (error) {
        console.error('Delete book error:', error);
        toast.error('Kitap silinirken bir hata oluştu');
      }
    } else {
      toast.error('Bu kitabı silme yetkiniz yok');
    }
  };

  return (
    <div className="book-item">
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
        <span className="book-category">{book.category}</span>
        <b className="book-title line-clamp-1">{book.title}</b>
        <span className="book-author">Yazar: {book.author}</span>
        <span className="book-status">
          Durum: {book.available ? 'Mevcut' : 'Ödünç Alınmış'}
        </span>
        <div className="book-meta mt-2 flex items-center gap-3 text-sm text-gray-600">
          {typeof book.avgRating === 'number' && (
            <span title="Ortalama Puan">⭐ {book.avgRating}</span>
          )}
          <span title="Yorum Sayısı">💬 {book.reviewCount || 0}</span>
        </div>
        
        <div className="book-actions">
          <Button
            color="primary"
            size="sm"
            onClick={handleViewDetails}
          >
            Detayları Gör
          </Button>
          
          {user?.role === 'admin' ? (
            <>
              <Button
                color="warning"
                size="sm"
                onClick={() => navigate(`/books/${book._id}/edit`)}
              >
                Düzenle
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={handleDeleteBook}
              >
                Sil
              </Button>
            </>
          ) : book.available && (
            <Button
              color="success"
              size="sm"
              onClick={handleBorrowBook}
              disabled={loading}
            >
              {loading ? 'İşleniyor...' : 'Ödünç Al'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookItem;