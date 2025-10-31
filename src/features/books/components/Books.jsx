import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import BookItem from "./BookItem";
import AddBook from "./AddBook";
import { bookService, favoriteService } from "../../../services";
import { useAuth } from "../../auth/context/useAuth";
import { toast } from "react-toastify";
import "../styles/Books.css";
import { ROLES } from '../../../constants/rolesConstants';
import remoteLogger from '../../../utils/remoteLogger';

function Books() {
  const { user } = useAuth();
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
      toast.success('Payment successful! Book purchased.');
      setSearchParams({}); // Clear the parameter from the URL
    } else if (paymentStatus === 'canceled') {
      toast.info('Payment canceled');
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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
      toast.error('Failed to fetch books.');
    } finally {
      setLoading(false);
    }
  }, [filters, user]);

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
      toast.success("Book deleted successfully!");
    } catch (error) {
      remoteLogger.error('Error deleting book', { error: error?.message || String(error), stack: error?.stack });

      if (error.message && error.message.includes('Invalid or expired access token')) {
        toast.error('Session expired. Please log in again.');
        window.location.href = '/login';
      } else {
        toast.error(error.message || 'Error occurred while deleting the book');
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
        <h1 className="text-2xl font-bold">DigiLibrary Books</h1>
        <div className="flex gap-3">
          {user?.role === ROLES.ADMIN && (
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-lg font-medium transition bg-green-600 text-white hover:bg-green-700"
            >
              + Add New Book
            </button>
          )}
          {user && user.role !== ROLES.ADMIN && (
            <button
              onClick={() => setShowOnlyFavorites(!showOnlyFavorites)}
              className={`px-4 py-2 rounded-lg font-medium transition ${showOnlyFavorites
                ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              {showOnlyFavorites ? '⭐ Show All' : '⭐ Show Favorites Only'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="filters mb-6 p-4 bg-gray-100 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">All Categories</option>
              <option value="Roman">Novel</option>
              <option value="Bilim">Science</option>
              <option value="Tarih">History</option>
              <option value="Felsefe">Philosophy</option>
              <option value="Edebiyat">Literature</option>
              <option value="Klasik">Classic</option>
              <option value="Şiir">Poetry</option>
              <option value="Biyografi">Biography</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">No Sorting</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
              <option value="createdAt">Date Added</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Order</label>
            <select
              value={filters.order}
              onChange={(e) => handleFilterChange('order', e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
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
          <p className="text-lg">Loading books...</p>
        </div>
      )}

      {!loading && displayBooks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-lg text-gray-500">
            {showOnlyFavorites ? 'You have no favorite books yet.' : 'No books available yet.'}
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