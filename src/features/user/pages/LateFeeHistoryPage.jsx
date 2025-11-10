import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loanService, paymentService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
import { toast } from 'react-toastify';
import { Calendar, BookOpen, AlertCircle, CreditCard } from 'lucide-react';
import Button from '../../../components/UI/buttons/Button';
import { useLanguage } from '../../../context/useLanguage';
import { ROLES } from '../../../constants/rolesConstants';
import '../styles/LateFeeHistoryPage.css';
import remoteLogger from '../../../utils/remoteLogger';

function LateFeeHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { t, getLocalizedText } = useLanguage();
  const [history, setHistory] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [payingLoanId, setPayingLoanId] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await loanService.getMyLateFees();
      setHistory(data.loans || []);
      setTotalFees(data.totalLateFees || 0);
    } catch (error) {
      remoteLogger.error('Error fetching late fee history', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.lateFees.errorLoading);
    }
  }, [t.lateFees.errorLoading]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    // Prevent admin access
    if (user && user.role === ROLES.ADMIN) {
      toast.error(t.lateFees.adminNoAccess || 'Administrators cannot access this page');
      navigate('/');
      return;
    }
    if (user) {
      fetchHistory();
    }
  }, [user, loading, navigate, fetchHistory, t.lateFees.adminNoAccess]);

  // Payment status check - separate useEffect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const pendingLoanId = localStorage.getItem('pendingLateFeePayment');

    if (paymentStatus === 'success' && pendingLoanId) {
      // Payment successful - send manual confirmation to backend
      const confirmPayment = async () => {
        try {
          await paymentService.confirmStripeLateFeePayment(pendingLoanId);
          localStorage.removeItem('pendingLateFeePayment');
          toast.success(t.lateFees.paymentSuccess, {
            autoClose: 3000,
          });
          // Clean query parameters from URL - use navigate to avoid LOGOUT
          navigate('/late-fees', { replace: true });
          // Refresh the list
          fetchHistory();
        } catch (error) {
          remoteLogger.error('Payment confirmation error', { error: error?.message || String(error), stack: error?.stack });
          // Clean localStorage and continue even if there is an error
          localStorage.removeItem('pendingLateFeePayment');
          // Check for network error
          if (error.message && error.message.includes('fetch')) {
            toast.warning(t.lateFees.paymentReceivedServerError);
          } else if (error.message && error.message.includes('CORS')) {
            toast.warning(t.lateFees.paymentReceivedCorsError);
          } else {
            toast.warning(t.lateFees.paymentReceivedButFailed);
          }
          // Navigate even if there is an error - avoid LOGOUT
          navigate('/late-fees', { replace: true });
          // Try to refresh the list
          try {
            fetchHistory();
          } catch (fetchError) {
            remoteLogger.error('Error fetching history after payment', { error: fetchError?.message || String(fetchError), stack: fetchError?.stack });
          }
        }
      };
      confirmPayment();
    } else if (paymentStatus === 'canceled') {
      localStorage.removeItem('pendingLateFeePayment');
      navigate('/late-fees', { replace: true });
    }
  }, [searchParams, navigate, fetchHistory, t.lateFees.paymentSuccess, t.lateFees.paymentReceivedServerError, t.lateFees.paymentReceivedCorsError, t.lateFees.paymentReceivedButFailed]);

  // Detect if user returned from Iyzico without completing payment
  useEffect(() => {
    const pendingLoanId = localStorage.getItem('pendingLateFeePayment');
    const paymentStatus = searchParams.get('payment');
    
    // If there's a pending payment but no payment status parameter,
    // user likely closed Iyzico page or navigated back without completing payment
    if (pendingLoanId && !paymentStatus && !payingLoanId) {
      // Clean up localStorage
      localStorage.removeItem('pendingLateFeePayment');
    }
  }, [searchParams, payingLoanId]);

  const handlePayment = async (loanId) => {
    try {
      setPayingLoanId(loanId);

      // Check if user is logged in
      if (!localStorage.getItem('accessToken') && !localStorage.getItem('refreshToken')) {
        toast.error(t.lateFees.sessionMissing);
        navigate('/login');
        return;
      }

      const response = await paymentService.createStripeLateFeeCheckout(loanId);

      if (response.success && response.url) {
        // Save Loan ID to localStorage (for use after payment)
        localStorage.setItem('pendingLateFeePayment', loanId);

        // Redirect to Stripe checkout page
        window.location.href = response.url;
      } else {
        toast.error(t.lateFees.paymentPageError);
        setPayingLoanId(null);
      }
    } catch (error) {
      remoteLogger.error('Error creating payment', { error: error?.message || String(error), stack: error?.stack });
      setPayingLoanId(null);

      // Check for network error
      if (error.message && error.message.includes('fetch')) {
        toast.error(t.lateFees.serverError);
      } else if (error.message && error.message.includes('CORS')) {
        toast.error(t.lateFees.corsError);
      } else if (error.message && error.message.includes('token')) {
        toast.error(t.lateFees.sessionExpired);
      } else {
        toast.error(error.message || t.lateFees.paymentInitError);
      }
    }
  };

  const handleIyzicoPayment = async (loanId) => {
    try {
      setPayingLoanId(loanId);

      // Check if user is logged in
      if (!localStorage.getItem('accessToken') && !localStorage.getItem('refreshToken')) {
        toast.error(t.lateFees.sessionMissing);
        navigate('/login');
        return;
      }

      const response = await paymentService.createIyzicoLateFeeCheckout(loanId);

      if (response.success && response.paymentPageUrl) {
        // Save Loan ID to localStorage (for use after payment)
        localStorage.setItem('pendingLateFeePayment', loanId);

        // Redirect to Iyzico checkout page
        window.location.href = response.paymentPageUrl;
      } else {
        toast.error(t.lateFees.paymentPageError);
        setPayingLoanId(null);
      }
    } catch (error) {
      remoteLogger.error('Error creating Iyzico payment', { error: error?.message || String(error), stack: error?.stack });
      setPayingLoanId(null);

      // Check for network error
      if (error.message && error.message.includes('fetch')) {
        toast.error(t.lateFees.serverError);
      } else if (error.message && error.message.includes('CORS')) {
        toast.error(t.lateFees.corsError);
      } else if (error.message && error.message.includes('token')) {
        toast.error(t.lateFees.sessionExpired);
      } else {
        toast.error(error.message || t.lateFees.paymentInitError);
      }
    }
  };

  if (loading) {
    return (
      <div className="late-fee-history-page">
        <div className="loading">{t.lateFees.loading}</div>
      </div>
    );
  }

  return (
    <div className="late-fee-history-page">
      <div className="late-fee-container">
        <div className="page-header">
          <h1>{t.lateFees.title}</h1>
          <Button color="secondary" size="sm" onClick={() => navigate('/profile')}>
            {t.lateFees.backToProfile}
          </Button>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          <div className="summary-icon">
            <span style={{ fontSize: '48px', fontWeight: 'bold' }}>₺</span>
          </div>
          <div className="summary-content">
            <h2>{totalFees} ₺</h2>
            <p>{t.lateFees.totalLateFee}</p>
            <span className="summary-count">
              {history.filter(loan => !loan.lateFeePaid).length} {t.lateFees.unpaid} • {history.length} {t.lateFees.total}
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={64} className="empty-icon" />
            <h3>{t.lateFees.noLateFees}</h3>
            <p>{t.lateFees.noLateFeesDesc}</p>
            <Button color="primary" onClick={() => navigate('/books')}>
              {t.lateFees.exploreBooks}
            </Button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((loan) => (
              <div key={loan._id} className="history-item">
                <div className="history-image">
                  <img
                    src={loan.book?.imageUrl || '/book-placeholder.jpg'}
                    alt={getLocalizedText(loan.book, 'title') || loan.book?.title_tr || loan.book?.title_en || loan.book?.title}
                    onError={(e) => {
                      e.target.src = '/book-placeholder.jpg';
                    }}
                  />
                </div>

                <div className="history-details">
                  <div className="history-header">
                    <h3 
                      className="font-semibold text-base dark:text-slate-100 line-clamp-2 flex-1" 
                      title={getLocalizedText(loan.book, 'title') || loan.book?.title_tr || loan.book?.title_en || loan.book?.title}
                    >
                      {getLocalizedText(loan.book, 'title') || loan.book?.title_tr || loan.book?.title_en || loan.book?.title}
                    </h3>
                    <div className="fee-badge">
                      {loan.lateFee} ₺
                    </div>
                  </div>

                  <p className="history-author">
                    <BookOpen size={16} />
                    {loan.book?.author}
                  </p>

                  <div className="history-dates">
                    <div className="date-item">
                      <Calendar size={14} />
                      <span>{t.lateFees.loaned}: {new Date(loan.loanDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="date-item">
                      <Calendar size={14} />
                      <span>{t.lateFees.due}: {new Date(loan.dueDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {loan.returnDate && (
                      <div className="date-item">
                        <Calendar size={14} />
                        <span>{t.lateFees.returned}: {new Date(loan.returnDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>

                  <div className="late-info">
                    <AlertCircle size={16} />
                    <span>{loan.daysLate} {t.lateFees.daysLate} • 5 ₺ {t.lateFees.perDay}</span>
                  </div>

                  {loan.lateFee > 0 && !loan.lateFeePaid && (
                    <div className="payment-actions">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => handlePayment(loan._id)}
                        disabled={payingLoanId === loan._id}
                        style={{ marginRight: '10px' }}
                      >
                        <CreditCard size={16} />
                        {payingLoanId === loan._id ? t.lateFees.redirecting : `Stripe - ${loan.lateFee} ₺ ${t.lateFees.pay}`}
                      </Button>
                      <Button
                        color="secondary"
                        size="sm"
                        onClick={() => handleIyzicoPayment(loan._id)}
                        disabled={payingLoanId === loan._id}
                      >
                        <CreditCard size={16} />
                        {payingLoanId === loan._id ? t.lateFees.redirecting : `Iyzico - ${loan.lateFee} ₺ ${t.lateFees.pay}`}
                      </Button>
                    </div>
                  )}

                  {loan.lateFeePaid && (
                    <div className="payment-status paid">
                      ✓ {t.lateFees.paid} ({new Date(loan.lateFeePaymentDate).toLocaleDateString('tr-TR')})
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {history.length > 0 && (
          <div className="info-box">
            <AlertCircle size={20} />
            <div>
              <h4>{t.lateFees.lateFeeSystemTitle}</h4>
              <p>{t.lateFees.lateFeeSystemDesc}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LateFeeHistoryPage;
