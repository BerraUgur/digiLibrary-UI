import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/UI/buttons/Button";
import { useAuth } from "../../auth/context/useAuth";
import { ROLES } from '../../../constants/rolesConstants';
import { loanService } from "../../../services";
import { LOAN_DURATION_DAYS, MS_PER_DAY } from '../../../constants/loanConstants';
import { toast } from "react-toastify";
import "../styles/BookItem.css";
import remoteLogger from '../../../utils/remoteLogger';

function BookItem({ book, onDeleteBook }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Borrow book
  const handleBorrowBook = async () => {
    if (!user) {
      toast.error('You must log in to borrow a book');
      navigate('/login');
      return;
    }

    // Auto dueDate LOAN_DURATION_DAYS later
    const dueDate = new Date(Date.now() + LOAN_DURATION_DAYS * MS_PER_DAY).toISOString().slice(0, 10);

    try {
      setLoading(true);
      remoteLogger.info('Borrowing book', { bookId: book._id, dueDate });
      await loanService.borrowBook({ bookId: book._id, dueDate });
      toast.success('Book successfully borrowed! Redirecting to borrowed books page...');
      setTimeout(() => {
        navigate('/my-loans', { replace: true });
      }, 1500);
    } catch (error) {
      remoteLogger.error('Borrow error', { error: error?.message || String(error), stack: error?.stack });
      setLoading(false);

      // Unpaid fees control
      if (error.message && error.message.includes('Unpaid')) {
        toast.error('You have unpaid fees. Please settle them before borrowing another book.');
      }
      else if (error.message && error.message.includes('Same time only 1 book allowed')) {
        toast.warning('📚 To borrow a new book, please return the book you have borrowed!', {
          autoClose: 5000,
          style: { fontSize: '15px' }
        });
      }
      // Ban message control
      else if (error.message && error.message.includes('ban')) {
        toast.error(error.message, { autoClose: 8000, style: { fontSize: '16px' } });
      } else if (error.message && error.message.includes('fetch')) {
        toast.error('Unable to connect to the server. Please ensure the backend server is running.');
      } else if (error.message && error.message.includes('CORS')) {
        toast.error('CORS error. Restart the backend server.');
      } else {
        toast.error(error.message || 'An error occurred while borrowing the book');
      }
    }
  };

  // Go to book details
  const handleViewDetails = () => {
    navigate(`/books/${book._id}`);
  };

  // Delete book (admin only)
  const handleDeleteBook = async () => {
    remoteLogger.info('Delete book requested', { userRole: user?.role, user: user ? { id: user.id, username: user.username } : null });

    if (user?.role === ROLES.ADMIN) {
      try {
        await onDeleteBook(book._id);
      } catch (error) {
        remoteLogger.error('Delete book error', { error: error?.message || String(error), stack: error?.stack });
        toast.error('An error occurred while deleting the book');
      }
    } else {
      toast.error('You do not have permission to delete this book');
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
        <span className="book-author">Author: {book.author}</span>
        <span className="book-status">
          Status: {book.available ? 'Available' : 'Borrowed'}
        </span>
        <div className="book-meta mt-2 flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
          {typeof book.avgRating === 'number' && (
            <span title="Average Rating">⭐ {book.avgRating}</span>
          )}
          <span title="Review Count">💬 {book.reviewCount || 0}</span>
        </div>

        <div className="book-actions">
          <Button
            color="primary"
            size="sm"
            onClick={handleViewDetails}
          >
            View Details
          </Button>

          {user?.role === ROLES.ADMIN ? (
            <>
              <Button
                color="warning"
                size="sm"
                onClick={() => navigate(`/books/${book._id}/edit`)}
              >
                Edit
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={handleDeleteBook}
              >
                Delete
              </Button>
            </>
          ) : book.available && (
            <Button
              color="success"
              size="sm"
              onClick={handleBorrowBook}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Borrow'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookItem;