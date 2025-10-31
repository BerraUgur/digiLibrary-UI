import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loanService, paymentService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
import { toast } from 'react-toastify';
import { Calendar, BookOpen, AlertCircle, CreditCard } from 'lucide-react';
import Button from '../../../components/UI/buttons/Button';
import '../styles/LateFeeHistoryPage.css';
import remoteLogger from '../../../utils/remoteLogger';

function LateFeeHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [payingLoanId, setPayingLoanId] = useState(null);

  const fetchHistory = async () => {
    try {
      const data = await loanService.getMyLateFees();
      setHistory(data.loans || []);
      setTotalFees(data.totalLateFees || 0);
    } catch (error) {
      remoteLogger.error('Error fetching late fee history', { error: error?.message || String(error), stack: error?.stack });
      toast.error('Error occurred while loading late fee history.');
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user) {
      fetchHistory();
    }
  }, [user, loading, navigate]);

  // Payment status check - separate useEffect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const pendingLoanId = localStorage.getItem('pendingLateFeePayment');

    if (paymentStatus === 'success' && pendingLoanId) {
      // Payment successful - send manual confirmation to backend
      const confirmPayment = async () => {
        try {
          await paymentService.confirmLateFeePayment(pendingLoanId);
          localStorage.removeItem('pendingLateFeePayment');
          toast.success('✅ Payment successful! Your late fee has been waived.', {
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
            toast.warning('⚠️ Payment received but unable to connect to the server. Please ensure the backend server is running and refresh the page.');
          } else if (error.message && error.message.includes('CORS')) {
            toast.warning('⚠️ Payment received but a CORS error occurred. Restart the backend server and refresh the page.');
          } else {
            toast.warning('⚠️ Payment received but update failed. Please refresh the page.');
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
      toast.info('❌ Payment canceled');
      navigate('/late-fees', { replace: true });
    }
  }, [searchParams, navigate]);

  const handlePayment = async (loanId) => {
    try {
      setPayingLoanId(loanId);

      // IMPORTANT: Warn if AccessToken is missing
      if (!localStorage.getItem('accessToken')) {
        // If RefreshToken exists, proceed; it will auto-refresh during the API request
        if (!localStorage.getItem('refreshToken')) {
          toast.error('⚠️ Session information is missing. Please log in again.');
          navigate('/login');
          return;
        }
      }

      const response = await paymentService.createLateFeeCheckout(loanId);

      if (response.success && response.url) {
        // Save Loan ID to localStorage (for use after payment)
        localStorage.setItem('pendingLateFeePayment', loanId);

        // FINAL CHECK: Warn if tokens are still missing
        if (!localStorage.getItem('accessToken')) {
          toast.warning('⚠️ Payment will be processed, but you may need to log in again afterwards.');
        }

        // Redirect to Stripe checkout page
        window.location.href = response.url;
      } else {
        toast.error('Unable to create payment page');
        setPayingLoanId(null);
      }
    } catch (error) {
      remoteLogger.error('Error creating payment', { error: error?.message || String(error), stack: error?.stack });
      setPayingLoanId(null);

      // Check for network error
      if (error.message && error.message.includes('fetch')) {
        toast.error('⚠️ Unable to connect to the server. Please ensure the backend server is running.');
      } else if (error.message && error.message.includes('CORS')) {
        toast.error('⚠️ CORS error. Restart the backend server.');
      } else if (error.message && error.message.includes('token')) {
        toast.error('⚠️ Session expired. Please refresh the page or log in again.');
      } else {
        toast.error(error.message || 'Error occurred while initiating payment');
      }
    }
  };

  if (loading) {
    return (
      <div className="late-fee-history-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="late-fee-history-page">
      <div className="late-fee-container">
        <div className="page-header">
          <h1>My Late Fee History</h1>
          <Button color="secondary" size="sm" onClick={() => navigate('/profile')}>
            ← Back to Profile
          </Button>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          <div className="summary-icon">
            <span style={{ fontSize: '48px', fontWeight: 'bold' }}>₺</span>
          </div>
          <div className="summary-content">
            <h2>{totalFees} ₺</h2>
            <p>Total Late Fee</p>
            <span className="summary-count">
              {history.filter(loan => !loan.lateFeePaid).length} unpaid • {history.length} total
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={64} className="empty-icon" />
            <h3>No Late Fees</h3>
            <p>Great! You've returned all your books on time.</p>
            <Button color="primary" onClick={() => navigate('/books')}>
              Explore Books
            </Button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((loan) => (
              <div key={loan._id} className="history-item">
                <div className="history-image">
                  <img
                    src={loan.book?.imageUrl || '/book-placeholder.jpg'}
                    alt={loan.book?.title}
                    onError={(e) => {
                      e.target.src = '/book-placeholder.jpg';
                    }}
                  />
                </div>

                <div className="history-details">
                  <div className="history-header">
                    <h3>{loan.book?.title}</h3>
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
                      <span>Loaned: {new Date(loan.loanDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="date-item">
                      <Calendar size={14} />
                      <span>Due: {new Date(loan.dueDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {loan.returnDate && (
                      <div className="date-item">
                        <Calendar size={14} />
                        <span>Returned: {new Date(loan.returnDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>

                  <div className="late-info">
                    <AlertCircle size={16} />
                    <span>{loan.daysLate} days late • 5 ₺ per day</span>
                  </div>

                  {loan.lateFee > 0 && !loan.lateFeePaid && (
                    <div className="payment-actions">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => handlePayment(loan._id)}
                        disabled={payingLoanId === loan._id}
                      >
                        <CreditCard size={16} />
                        {payingLoanId === loan._id ? 'Redirecting...' : `${loan.lateFee} ₺ Pay`}
                      </Button>
                    </div>
                  )}

                  {loan.lateFeePaid && (
                    <div className="payment-status paid">
                      ✓ Paid ({new Date(loan.lateFeePaymentDate).toLocaleDateString('tr-TR')})
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
              <h4>Late Fee System</h4>
              <p>A late fee of 5 ₺ is applied for each day a book is returned past its due date. Please remember to return your books on time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LateFeeHistoryPage;
