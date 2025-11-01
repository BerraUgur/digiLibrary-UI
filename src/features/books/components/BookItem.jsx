import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/UI/buttons/Button";
import { useAuth } from "../../auth/context/useAuth";
import { useLanguage } from "../../../context/useLanguage";
import { ROLES } from '../../../constants/rolesConstants';
import { loanService } from "../../../services";
import { LOAN_DURATION_DAYS, MS_PER_DAY } from '../../../constants/loanConstants';
import { toast } from "react-toastify";
import "../styles/BookItem.css";
import remoteLogger from '../../../utils/remoteLogger';

function BookItem({ book, onDeleteBook }) {
  const { user } = useAuth();
  const { t, translateCategory } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Borrow book
  const handleBorrowBook = async () => {
    if (!user) {
      toast.error(t.books.mustLoginToBorrow);
      navigate('/login');
      return;
    }

    // Auto dueDate LOAN_DURATION_DAYS later
    const dueDate = new Date(Date.now() + LOAN_DURATION_DAYS * MS_PER_DAY).toISOString().slice(0, 10);

    try {
      setLoading(true);
      remoteLogger.info('Borrowing book', { bookId: book._id, dueDate });
      await loanService.borrowBook({ bookId: book._id, dueDate });
      toast.success(t.books.borrowedSuccess);
      setTimeout(() => {
        navigate('/my-loans', { replace: true });
      }, 1500);
    } catch (error) {
      remoteLogger.error('Borrow error', { error: error?.message || String(error), stack: error?.stack });
      setLoading(false);

      // Unpaid fees control
      if (error.message && error.message.includes('Unpaid')) {
        toast.error(t.books.unpaidFees);
      }
      else if (error.message && error.message.includes('Same time only 1 book allowed')) {
        toast.warning(t.books.returnCurrentBook, {
          autoClose: 5000,
          style: { fontSize: '15px' }
        });
      }
      // Ban message control
      else if (error.message && error.message.includes('ban')) {
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
        toast.error(t.books.deleteBookError);
      }
    } else {
      toast.error(t.books.noPermissionToDelete);
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
        <span className="book-category">{translateCategory(book.category)}</span>
        <b className="book-title line-clamp-1">{book.title}</b>
        <span className="book-author">{t.books.author}: {book.author}</span>
        <span className="book-status">
          {t.books.status}: {book.available ? t.books.available : t.books.borrowed}
        </span>
        <div className="book-meta mt-2 flex items-center gap-3 text-sm text-gray-600 dark:text-slate-300">
          {typeof book.avgRating === 'number' && (
            <span title={t.books.avgRating}>⭐ {book.avgRating}</span>
          )}
          <span title={t.books.reviewCount}>💬 {book.reviewCount || 0}</span>
        </div>

        <div className="book-actions">
          <Button
            color="primary"
            size="sm"
            onClick={handleViewDetails}
          >
            {t.books.viewDetails}
          </Button>

          {user?.role === ROLES.ADMIN ? (
            <>
              <Button
                color="warning"
                size="sm"
                onClick={() => navigate(`/books/${book._id}/edit`)}
              >
                {t.general.edit}
              </Button>
              <Button
                color="danger"
                size="sm"
                onClick={handleDeleteBook}
              >
                {t.general.delete}
              </Button>
            </>
          ) : book.available && (
            <Button
              color="success"
              size="sm"
              onClick={handleBorrowBook}
              disabled={loading}
            >
              {loading ? (t.books.processing) : t.books.borrow}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default BookItem;