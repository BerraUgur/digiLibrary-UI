import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookItem from "./BookItem";
import AddBook from "./AddBook";
import { bookService, favoriteService } from "../../../services";
import { useAuth } from "../../auth/context/useAuth";
import { useLanguage } from "../../../context/useLanguage";
import { toast } from "react-toastify";
import "../styles/Books.css";
import { ROLES } from '../../../constants/rolesConstants';
import remoteLogger from '../../../utils/remoteLogger';

function Books() {
  const { user } = useAuth();
  const { t, translateCategory } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    sortBy: '',
    order: 'asc'
  });

  // Payment status check
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    if (paymentStatus === 'success') {
      toast.success(t.books.paymentSuccess);
      setSearchParams({}); // Clear the parameter from the URL
    } else if (paymentStatus === 'canceled') {
      toast.info(t.books.paymentCanceled);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams, t.books.paymentSuccess, t.books.paymentCanceled]);

  // Fetch books and favorites
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
        remoteLogger.warn('Unexpected book response format', { payload: data });
      }
      setBooks(normalized);

      // If user is logged in, fetch favorites as well
      if (user) {
        try {
          const favData = await favoriteService.list();
          setFavorites(favData.favorites || favData || []);
        } catch {
          setFavorites([]);
        }
      }
    } catch (error) {
      remoteLogger.error('Error fetching books', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.books.fetchBooksError);
    } finally {
      setLoading(false);
    }
  }, [filters, user, t.books.fetchBooksError]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Delete book
  const handleDeleteBook = async (bookId) => {
    try {
      remoteLogger.info('Deleting book', { bookId });
      const response = await bookService.deleteBook(bookId);
      remoteLogger.info('Delete response', { response });
      setBooks(books.filter(book => book._id !== bookId));
      toast.success(t.books.bookDeletedSuccess);
    } catch (error) {
      remoteLogger.error('Error deleting book', { error: error?.message || String(error), stack: error?.stack });

      if (error.message && error.message.includes('Invalid or expired access token')) {
        toast.error(t.books.sessionExpired);
        window.location.href = '/login';
      } else {
        toast.error(error.message || t.books.deleteBookError);
      }
    }
  };

  // Filter change handler
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Get favorite book IDs
  const favoriteBookIds = favorites.map(fav => fav.bookId?._id || fav.bookId);

  // Filter displayed books
  const displayBooks = showOnlyFavorites
    ? books.filter(book => favoriteBookIds.includes(book._id))
    : books;

  return (
    <div className="books">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t.books.allBooks}</h1>
        <div className="flex gap-3">
          {user?.role === ROLES.ADMIN && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700"
            >
              + {t.books.addBook}
            </button>
          )}
          {user && user.role !== ROLES.ADMIN && (
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-4 py-2 rounded-lg font-medium transition ${showOnlyFavorites
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-300 dark:hover:bg-slate-600'
                }`}
            >
              {showOnlyFavorites ? `⭐ ${t.books.showAll || 'Tümünü Göster'}` : `⭐ ${t.books.showFavoritesOnly || 'Sadece Favoriler'}`}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters mb-6 p-4 bg-gray-100 dark:bg-slate-800 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">{t.books.category || 'Kategori'}</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full p-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600"
            >
              <option value="">{t.books.allCategories || 'Tüm Kategoriler'}</option>
              <option value="Novel">{translateCategory('Novel')}</option>
              <option value="Science">{translateCategory('Science')}</option>
              <option value="History">{translateCategory('History')}</option>
              <option value="Philosophy">{translateCategory('Philosophy')}</option>
              <option value="Literature">{translateCategory('Literature')}</option>
              <option value="Classic">{translateCategory('Classic')}</option>
              <option value="Poetry">{translateCategory('Poetry')}</option>
              <option value="Biography">{translateCategory('Biography')}</option>
              <option value="Other">{translateCategory('Other')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.books.sortBy || 'Sırala'}</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full p-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600"
            >
              <option value="">{t.books.noSorting || 'Sıralama Yok'}</option>
              <option value="title">{t.books.title}</option>
              <option value="author">{t.books.author}</option>
              <option value="createdAt">{t.books.dateAdded || 'Eklenme Tarihi'}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t.books.order || 'Sıralama'}</label>
            <select
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="w-full p-2 border rounded dark:bg-slate-900 dark:text-slate-100 dark:border-slate-600"
            >
              <option value="asc">{t.books.ascending || 'Artan'}</option>
              <option value="desc">{t.books.descending || 'Azalan'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Add Book Modal */}
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
          <p className="text-lg">{t.books.loading}</p>
        </div>
      )}

      {!loading && displayBooks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">
            {showOnlyFavorites ? (t.books.noFavorites || 'Henüz favori kitabınız yok.') : t.books.noBooks}
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