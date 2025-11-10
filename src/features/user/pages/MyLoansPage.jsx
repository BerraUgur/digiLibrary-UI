import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import '../styles/MyLoansPage.css';
import remoteLogger from '../../../utils/remoteLogger';

function MyLoansPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, translateCategory, getLocalizedText } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchLoans();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, navigate]);

  const fetchLoans = async () => {
    try {
      setPageLoading(true);
      const data = await loanService.getUserLoans();

      // Sorting logic:
      // 1. Unreturned loans (active) - newest at the top
      // 2. Returned loans - newest at the top
      const sorted = [...data].sort((a, b) => {
        // Prioritize by return status
        if (a.isReturned !== b.isReturned) {
          return a.isReturned ? 1 : -1; // Unreturned (false) at the top
        }

        // Sort by date for loans with the same status
        if (a.isReturned && b.isReturned) {
          // Both returned, sort by returnDate (newest at the top)
          return new Date(b.returnDate) - new Date(a.returnDate);
        }
        return new Date(b.loanDate) - new Date(a.loanDate);
      });

      setLoans(sorted);
    } catch (error) {
      remoteLogger.error('Error fetching loans', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.loans.fetchError);
    } finally {
      setPageLoading(false);
    }
  };

  const handleReturnBook = async (loanId) => {
    try {
      await loanService.returnBook(loanId);
      toast.success(t.loans.returnSuccess);
      // Refresh the page to get the updated loan list
      await fetchLoans();
    } catch (error) {
      remoteLogger.error('Return book error', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.loans.returnError);
    }
  };

  const calculateDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (loan) => {
    if (loan.isReturned) return 'returned';
    const daysRemaining = calculateDaysRemaining(loan.dueDate);
    if (daysRemaining < 0) return 'overdue';
    if (daysRemaining <= 3) return 'warning';
    return 'active';
  };

  const getStatusText = (loan) => {
    if (loan.isReturned) return t.loans.returned;
    const daysRemaining = calculateDaysRemaining(loan.dueDate);
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} ${t.loans.daysOverdue}`;
    if (daysRemaining === 0) return t.loans.dueToday;
    if (daysRemaining === 1) return t.loans.dueTomorrow;
    return `${daysRemaining} ${t.loans.daysLeft}`;
  };

  if (pageLoading) {
    return (
      <div className="my-loans-page">
        <div className="loading">{t.loans.loading}</div>
      </div>
    );
  }

  return (
    <div className="my-loans-page">
      <div className="my-loans-container">
        <div className="page-header">
          <h1>{t.loans.myBorrowedBooks}</h1>
        </div>

        {loans.length === 0 ? (
          <div className="no-loans">
            <p>{t.loans.noLoans}</p>
            <Button
              color="primary"
              onClick={() => navigate('/books')}
            >
              {t.loans.exploreBooks}
            </Button>
          </div>
        ) : (
          <div className="loans-grid">
            {loans.map((loan) => (
              <div key={loan._id} className={`loan-card ${getStatusColor(loan)}`}>
                <div className="loan-image">
                  <img
                    src={loan.book?.imageUrl || '/book-placeholder.jpg'}
                    alt={getLocalizedText(loan.book, 'title')}
                    onError={(e) => {
                      e.target.src = '/book-placeholder.jpg';
                    }}
                  />
                </div>

                <div className="loan-info">
                  <h3 className="loan-title" title={getLocalizedText(loan.book, 'title') || loan.book?.title}>
                    {getLocalizedText(loan.book, 'title') || loan.book?.title}
                  </h3>
                  <p className="loan-author">{t.books.author}: {loan.book?.author}</p>
                  <p className="loan-category">{t.books.category}: {translateCategory(loan.book?.category)}</p>

                  <div className="loan-dates">
                    <p className="loan-date">
                      <strong>{t.loans.loanDate}:</strong> {new Date(loan.loanDate).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="loan-date">
                      <strong>{t.loans.dueDate}:</strong> {new Date(loan.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                    {loan.returnDate && (
                      <p className="loan-date">
                        <strong>{t.loans.returnDate}:</strong> {new Date(loan.returnDate).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>

                  {/* Late Return Fee */}
                  {(loan.daysLate > 0 || loan.lateFee > 0) && (
                    <div className="late-fee-warning" style={{
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      padding: '12px',
                      borderRadius: '8px',
                      marginTop: '12px'
                    }}>
                      <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#856404' }}>
                        ⚠️ {t.loans.lateReturnFee}
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', color: '#856404' }}>
                        {loan.daysLate} {t.loans.daysLate} • <strong>{loan.lateFee || (loan.daysLate * 5)} TL</strong> {t.loans.fee}
                      </p>
                      {loan.lateFeePaid && (
                        <p style={{ margin: '8px 0 0 0', fontSize: '13px', color: '#155724', fontWeight: '600' }}>
                          ✅ {loan.paymentMethod === 'stripe' 
                            ? (t.loans.paidWithStripe || 'Stripe ile ödendi')
                            : loan.paymentMethod === 'iyzico' 
                            ? (t.loans.paidWithIyzico || 'Iyzico ile ödendi')
                            : (t.loans.paid || 'Ödendi')}
                          {loan.lateFeePaymentDate && ` • ${new Date(loan.lateFeePaymentDate).toLocaleDateString('tr-TR')}`}
                        </p>
                      )}
                    </div>
                  )}

                  <div className={`loan-status ${getStatusColor(loan)}`}>
                    {getStatusText(loan)}
                  </div>

                  {!loan.isReturned && (
                    <Button
                      color="success"
                      size="sm"
                      onClick={() => handleReturnBook(loan._id)}
                      className="return-button"
                    >
                      {t.loans.returnBook}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyLoansPage;