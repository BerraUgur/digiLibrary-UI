import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loanService, paymentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Calendar, BookOpen, AlertCircle, CreditCard } from 'lucide-react';
import Button from '../components/UI/Button';
import './LateFeeHistoryPage.css';

function LateFeeHistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [totalFees, setTotalFees] = useState(0);
  const [loading, setLoading] = useState(true);
  const [payingLoanId, setPayingLoanId] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await loanService.getMyLateFees();
      setHistory(data.loans || []);
      setTotalFees(data.totalLateFees || 0);
    } catch (error) {
      console.error('Error fetching late fee history:', error);
      toast.error('Ceza geçmişi yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchHistory();
  }, [user, navigate]);

  // Ödeme durumu kontrolü - ayrı useEffect
  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const pendingLoanId = localStorage.getItem('pendingLateFeePayment');
    
    if (paymentStatus === 'success' && pendingLoanId) {
      // Ödeme başarılı - backend'e manuel onay gönder
      const confirmPayment = async () => {
        try {
          await paymentService.confirmLateFeePayment(pendingLoanId);
          localStorage.removeItem('pendingLateFeePayment');
          toast.success('✅ Ödeme başarılı! Geç iade ücretiniz silindi.', {
            autoClose: 3000,
          });
          // URL'den query parametrelerini temizle - LOGOUT YAPMASIN DİYE navigate kullan
          navigate('/late-fees', { replace: true });
          // Listeyi yenile
          fetchHistory();
        } catch (error) {
          console.error('Payment confirmation error:', error);
          // Hata olsa bile localStorage temizle ve devam et
          localStorage.removeItem('pendingLateFeePayment');
          // Network hatası mı kontrol et
          if (error.message && error.message.includes('fetch')) {
            toast.warning('⚠️ Ödeme alındı ama sunucuya bağlanılamadı. Backend sunucusunun çalıştığından emin olun ve sayfayı yenileyin.');
          } else if (error.message && error.message.includes('CORS')) {
            toast.warning('⚠️ Ödeme alındı ama CORS hatası oluştu. Backend sunucusunu yeniden başlatın ve sayfayı yenileyin.');
          } else {
            toast.warning('⚠️ Ödeme alındı ama güncelleme başarısız. Lütfen sayfayı yenileyin.');
          }
          // Hata olsa bile navigate et - LOGOUT YAPMASIN
          navigate('/late-fees', { replace: true });
          // Listeyi yenilemeyi dene
          try {
            fetchHistory();
          } catch (fetchError) {
            console.error('Error fetching history after payment:', fetchError);
          }
        }
      };
      confirmPayment();
    } else if (paymentStatus === 'canceled') {
      localStorage.removeItem('pendingLateFeePayment');
      toast.info('❌ Ödeme iptal edildi');
      navigate('/late-fees', { replace: true });
    }
  }, [searchParams, navigate]);

  const handlePayment = async (loanId) => {
    try {
      setPayingLoanId(loanId);
      
      // ÖNEMLİ: AccessToken eksikse UYARI ver
      if (!localStorage.getItem('accessToken')) {
        // RefreshToken varsa devam et, API isteği sırasında otomatik refresh olacak
        if (!localStorage.getItem('refreshToken')) {
          toast.error('⚠️ Oturum bilgileri eksik. Lütfen tekrar giriş yapın.');
          navigate('/login');
          return;
        }
      }
      
      const response = await paymentService.createLateFeeCheckout(loanId);
      
      if (response.success && response.url) {
        // Loan ID'yi localStorage'a kaydet (ödeme sonrası kullanmak için)
        localStorage.setItem('pendingLateFeePayment', loanId);
        
        // SON KONTROL: Token'lar hala eksikse kullanıcıyı uyar
        if (!localStorage.getItem('accessToken')) {
          toast.warning('⚠️ Ödeme yapılacak ama geri döndüğünüzde tekrar giriş yapmanız gerekebilir.');
        }
        
        // Stripe checkout sayfasına yönlendir
        window.location.href = response.url;
      } else {
        toast.error('Ödeme sayfası oluşturulamadı');
        setPayingLoanId(null);
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      setPayingLoanId(null);
      
      // Network hatası mı kontrol et
      if (error.message && error.message.includes('fetch')) {
        toast.error('⚠️ Sunucuya bağlanılamadı. Backend sunucusunun çalıştığından emin olun.');
      } else if (error.message && error.message.includes('CORS')) {
        toast.error('⚠️ CORS hatası. Backend sunucusunu yeniden başlatın.');
      } else if (error.message && error.message.includes('token')) {
        toast.error('⚠️ Oturum süresi dolmuş. Lütfen sayfayı yenileyin veya tekrar giriş yapın.');
      } else {
        toast.error(error.message || 'Ödeme başlatılırken hata oluştu');
      }
    }
  };

  if (loading) {
    return (
      <div className="late-fee-history-page">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="late-fee-history-page">
      <div className="late-fee-container">
        <div className="page-header">
          <h1>Geç İade Ceza Geçmişim</h1>
          <Button color="secondary" size="sm" onClick={() => navigate('/profile')}>
            ← Profile Dön
          </Button>
        </div>

        {/* Summary Card */}
        <div className="summary-card">
          <div className="summary-icon">
            <span style={{ fontSize: '48px', fontWeight: 'bold' }}>₺</span>
          </div>
          <div className="summary-content">
            <h2>{totalFees} ₺</h2>
            <p>Toplam Geç İade Cezası</p>
            <span className="summary-count">
              {history.filter(loan => !loan.lateFeePaid).length} ödenmemiş • {history.length} toplam
            </span>
          </div>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <AlertCircle size={64} className="empty-icon" />
            <h3>Geç İade Cezanız Yok</h3>
            <p>Harika! Tüm kitaplarınızı zamanında iade etmişsiniz.</p>
            <Button color="primary" onClick={() => navigate('/books')}>
              Kitap Keşfet
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
                      <span>Ödünç: {new Date(loan.loanDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <div className="date-item">
                      <Calendar size={14} />
                      <span>Son Gün: {new Date(loan.dueDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {loan.returnDate && (
                      <div className="date-item">
                        <Calendar size={14} />
                        <span>İade: {new Date(loan.returnDate).toLocaleDateString('tr-TR')}</span>
                      </div>
                    )}
                  </div>

                  <div className="late-info">
                    <AlertCircle size={16} />
                    <span>{loan.daysLate} gün geç iade • Günlük 5 ₺</span>
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
                        {payingLoanId === loan._id ? 'Yönlendiriliyor...' : `${loan.lateFee} ₺ Öde`}
                      </Button>
                    </div>
                  )}

                  {loan.lateFeePaid && (
                    <div className="payment-status paid">
                      ✓ Ödendi ({new Date(loan.lateFeePaymentDate).toLocaleDateString('tr-TR')})
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
              <h4>Geç İade Ceza Sistemi</h4>
              <p>Kitapların iade tarihinden sonraki her gün için 5 ₺ gecikme cezası uygulanır. Lütfen kitaplarınızı zamanında iade etmeyi unutmayın.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LateFeeHistoryPage;
