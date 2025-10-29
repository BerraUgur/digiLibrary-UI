import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Button from '../components/UI/Button';
import './MyLoansPage.css';

function MyLoansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    fetchLoans();
  }, [user, navigate]);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = await loanService.getUserLoans();
      
      // Sıralama mantığı:
      // 1. Önce iade edilmeyenler (aktif olanlar) - en yeni üstte
      // 2. Sonra iade edilenler - en yeni üstte
      const sorted = [...data].sort((a, b) => {
        // İade durumuna göre öncelik
        if (a.isReturned !== b.isReturned) {
          return a.isReturned ? 1 : -1; // İade edilmeyenler (false) üstte
        }
        
        // Aynı durumda olanları tarih olarak sırala
        if (a.isReturned && b.isReturned) {
          // İkisi de iade edilmişse, returnDate'e göre sırala (yeni üstte)
          return new Date(b.returnDate).getTime() - new Date(a.returnDate).getTime();
        } else {
          // İkisi de iade edilmemişse, loanDate'e göre sırala (yeni üstte)
          return new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime();
        }
      });
      
      setLoans(sorted);
    } catch (_error) {
      // Hata konsola yaz ve kullanıcıya bildirim göster
      console.error('Error fetching loans:', _error);
      toast.error('Ödünç alınan kitaplar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnBook = async (loanId) => {
    try {
      await loanService.returnBook(loanId);
      toast.success('Kitap başarıyla iade edildi!');
      // Sayfayı yenile - güncel loan listesini getir
      await fetchLoans();
    } catch (error) {
      console.error('Return book error:', error);
      toast.error('Kitap iade edilirken bir hata oluştu');
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
    if (loan.isReturned) return 'İade Edildi';
    const daysRemaining = calculateDaysRemaining(loan.dueDate);
    if (daysRemaining < 0) return `${Math.abs(daysRemaining)} gün gecikmiş`;
    if (daysRemaining === 0) return 'Bugün son gün';
    if (daysRemaining === 1) return 'Yarın son gün';
    return `${daysRemaining} gün kaldı`;
  };

  if (loading) {
    return (
      <div className="my-loans-page">
        <div className="loading">Ödünç alınan kitaplar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="my-loans-page">
      <div className="my-loans-container">
        <div className="page-header">
          <h1>Ödünç Aldığım Kitaplar</h1>
        </div>

        {loans.length === 0 ? (
          <div className="no-loans">
            <p>Henüz kitap ödünç almamışsınız.</p>
            <Button 
              color="primary" 
              onClick={() => navigate('/books')}
            >
              Kitap Keşfet
            </Button>
          </div>
        ) : (
          <div className="loans-grid">
            {loans.map((loan) => (
              <div key={loan._id} className={`loan-card ${getStatusColor(loan)}`}>
                <div className="loan-image">
                  <img 
                    src={loan.book?.imageUrl || '/book-placeholder.jpg'} 
                    alt={loan.book?.title}
                    onError={(e) => {
                      e.target.src = '/book-placeholder.jpg';
                    }}
                  />
                </div>
                
                <div className="loan-info">
                  <h3 className="loan-title">{loan.book?.title}</h3>
                  <p className="loan-author">Yazar: {loan.book?.author}</p>
                  <p className="loan-category">Kategori: {loan.book?.category}</p>
                  
                  <div className="loan-dates">
                    <p className="loan-date">
                      <strong>Ödünç Alma:</strong> {new Date(loan.loanDate).toLocaleDateString('tr-TR')}
                    </p>
                    <p className="loan-date">
                      <strong>İade Tarihi:</strong> {new Date(loan.dueDate).toLocaleDateString('tr-TR')}
                    </p>
                    {loan.returnDate && (
                      <p className="loan-date">
                        <strong>İade Edilme:</strong> {new Date(loan.returnDate).toLocaleDateString('tr-TR')}
                      </p>
                    )}
                  </div>
                  
                  {/* Geç İade Cezası */}
                  {loan.daysLate > 0 && (
                    <div className="late-fee-warning" style={{
                      background: '#fff3cd',
                      border: '1px solid #ffc107',
                      padding: '12px',
                      borderRadius: '8px',
                      marginTop: '12px'
                    }}>
                      <p style={{margin: '0 0 4px 0', fontWeight: '600', color: '#856404'}}>
                        ⚠️ Geç İade Cezası
                      </p>
                      <p style={{margin: 0, fontSize: '14px', color: '#856404'}}>
                        {loan.daysLate} gün geç • <strong>{loan.lateFee || (loan.daysLate * 5)} TL</strong> ceza
                      </p>
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
                      Kitabı İade Et
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