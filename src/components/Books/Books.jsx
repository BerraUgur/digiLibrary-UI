import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BookItem from "./BookItem";
import AddBook from "./AddBook";
import { bookService, favoriteService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./Books.css";

function Books() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: '',
    order: 'asc'
  });

  // Ödeme durumu kontrolü
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success('Ödeme başarılı! Kitap satın alındı.');
      setSearchParams({}); // URL'den parametreyi temizle
    } else if (paymentStatus === 'canceled') {
      toast.info('Ödeme iptal edildi');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Kitapları ve favorileri getir
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await bookService.getAllBooks(filters);
      const normalized = Array.isArray(data)
        ? data
        : Array.isArray(data?.items)
          ? data.items
          : [];
      if (!Array.isArray(data) && !Array.isArray(data?.items)) {
        console.warn('Beklenmeyen kitap yanıtı formatı:', data);
      }
      setBooks(normalized);
      
      // Kullanıcı giriş yaptıysa favorileri de çek
      if (user) {
        try {
          const favData = await favoriteService.list();
          setFavorites(favData.favorites || favData || []);
        } catch {
          setFavorites([]);
        }
      }
    } catch (error) {
      toast.error('Kitaplar yüklenirken bir hata oluştu');
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Kitap silme
  const handleDeleteBook = async (bookId) => {
    try {
      console.log('Deleting book with ID:', bookId);
      const response = await bookService.deleteBook(bookId);
      console.log('Delete response:', response);
      setBooks(books.filter(book => book._id !== bookId));
      toast.success("Kitap başarıyla silindi!");
    } catch (error) {
      console.error('Error deleting book:', error);
      
      if (error.message && error.message.includes('Invalid or expired access token')) {
        toast.error('Oturum süresi dolmuş. Lütfen tekrar giriş yapın.');
        window.location.href = '/login';
      } else {
        toast.error(error.message || 'Kitap silinirken bir hata oluştu');
      }
    }
  };

  // Filtre değişiklikleri
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Favori kitap ID'lerini al
  const favoriteBookIds = favorites.map(fav => fav.bookId?._id || fav.bookId);
  
  // Gösterilecek kitapları filtrele
  const displayBooks = showOnlyFavorites
    ? books.filter(book => favoriteBookIds.includes(book._id))
    : books;

  return (
    <div className="books">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Kütüphane Kitapları</h1>
        <div className="flex gap-3">
          {user?.role === 'admin' && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700"
            >
              + Yeni Kitap Ekle
            </button>
          )}
          {user && user.role !== 'admin' && (
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                showOnlyFavorites
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {showOnlyFavorites ? '⭐ Tümünü Göster' : '⭐ Sadece Favoriler'}
            </button>
          )}
        </div>
      </div>
      
      {/* Filtreler */}
      <div className="filters mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Kategori</label>
            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Tüm Kategoriler</option>
              <option value="Roman">Roman</option>
              <option value="Bilim">Bilim</option>
              <option value="Tarih">Tarih</option>
              <option value="Felsefe">Felsefe</option>
              <option value="Edebiyat">Edebiyat</option>
              <option value="Klasik">Klasik</option>
              <option value="Şiir">Şiir</option>
              <option value="Biyografi">Biyografi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Sıralama</label>
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">Sıralama Yok</option>
              <option value="title">Başlık</option>
              <option value="author">Yazar</option>
              <option value="createdAt">Eklenme Tarihi</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Sıra</label>
            <select 
              value={filters.order} 
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="asc">Artan</option>
              <option value="desc">Azalan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Kitap Ekle Modal - MyBooksPage'deki gibi */}
      {isAddModalOpen && (
        <div className="add-book-modal">
          <AddBook
            onAddBook={(newBook) => {
              setBooks(prev => [...prev, newBook]);
              setIsAddModalOpen(false);
            }}
            setIsShowModal={setIsAddModalOpen}
            onAdded={() => {
              fetchBooks();
              setIsAddModalOpen(false);
            }}
          />
        </div>
      )}

      {loading && (
        <div className="text-center py-8">
          <p className="text-lg">Kitaplar yükleniyor...</p>
        </div>
      )}
      
      {!loading && displayBooks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">
            {showOnlyFavorites ? 'Henüz favori kitabınız yok.' : 'Henüz kitap bulunmuyor.'}
          </p>
        </div>
      )}
      
      <div className="books-wrapper">
        {displayBooks.map((book) => (
          <BookItem
            key={book._id}
            book={book}
            onDeleteBook={handleDeleteBook}
          />
        ))}
      </div>
    </div>
  ); 
}

export default Books;