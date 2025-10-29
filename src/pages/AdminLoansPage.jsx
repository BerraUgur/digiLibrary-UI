import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { AlertCircle, Users, Calendar, BookOpen, Mail, Search, FileText } from 'lucide-react';
import Button from '../components/UI/Button';
import './AdminLoansPage.css';

function AdminLoansPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, overdue, returned
  const [searchUser, setSearchUser] = useState('');
  const [searchBook, setSearchBook] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Bu sayfaya erişim yetkiniz yok');
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [loansData, statsData] = await Promise.all([
          loanService.getAllLoansAdmin({}), // Tüm dataları çek, frontend'de filtrele
          loanService.getLateFeeStats(),
        ]);

        // Backend direkt array dönüyor, .loans değil!
        setLoans(Array.isArray(loansData) ? loansData : []);
        // setFilteredLoans'u burada set etme, useEffect'te filtreleme yapılacak
        setStats(statsData);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        toast.error('Veriler yüklenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]); // filter'ı dependency'den çıkardık

  // Filter loans based on search criteria
  useEffect(() => {
    let filtered = loans;

    // Status filter (Tümü, Aktif, Gecikmiş, İade Edilmiş)
    if (filter === 'active') {
      filtered = filtered.filter(loan => !loan.isReturned && (loan.daysLate === 0 || !loan.daysLate));
    } else if (filter === 'overdue') {
      filtered = filtered.filter(loan => !loan.isReturned && loan.daysLate > 0);
    } else if (filter === 'returned') {
      filtered = filtered.filter(loan => loan.isReturned);
    }
    // 'all' durumunda tümünü göster

    // User search
    if (searchUser) {
      filtered = filtered.filter(loan =>
        loan.user?.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
        loan.user?.email?.toLowerCase().includes(searchUser.toLowerCase())
      );
    }

    // Book search
    if (searchBook) {
      filtered = filtered.filter(loan =>
        loan.book?.title?.toLowerCase().includes(searchBook.toLowerCase())
      );
    }

    // Date range filter
    if (startDate) {
      filtered = filtered.filter(loan =>
        new Date(loan.loanDate) >= new Date(startDate)
      );
    }

    if (endDate) {
      filtered = filtered.filter(loan =>
        new Date(loan.loanDate) <= new Date(endDate)
      );
    }

    setFilteredLoans(filtered);
  }, [loans, searchUser, searchBook, startDate, endDate, filter]);

  const handleWaiveFee = async (loanId) => {
    if (!window.confirm('Bu ödünç kaydının cezasını silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      await loanService.waiveLateFee(loanId);
      toast.success('Ceza silindi');

      // Refresh data - TÜM dataları çek, filtreleme useEffect'te yapılacak
      setLoading(true);
      const [loansData, statsData] = await Promise.all([
        loanService.getAllLoansAdmin({}), // Boş obje gönder, tüm dataları al
        loanService.getLateFeeStats(),
      ]);
      // Backend direkt array dönüyor, .loans yok!
      setLoans(Array.isArray(loansData) ? loansData : []);
      // setFilteredLoans'u set etme, useEffect otomatik filtreleyecek
      setStats(statsData);
      setLoading(false);
    } catch (error) {
      console.error('Error waiving fee:', error);
      toast.error('Ceza silinirken hata oluştu');
      setLoading(false);
    }
  };

  const handleExportToPDF = () => {
    if (filteredLoans.length === 0) {
      toast.warning('Dışa aktarılacak veri yok');
      return;
    }

    // PDF içeriği oluştur
    let pdfContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Ödünç Kayıtları Raporu</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; font-size: 12px; }
            th { background-color: #3498db; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .overdue { background-color: #ffebee !important; }
            .header-info { margin-bottom: 20px; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>📚 Kütüphane Ödünç Kayıtları Raporu</h1>
          <div class="header-info">
            <p><strong>Rapor Tarihi:</strong> ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
            <p><strong>Toplam Kayıt:</strong> ${filteredLoans.length}</p>
            <p><strong>Toplam Gecikme Cezası:</strong> ${filteredLoans.reduce((sum, l) => sum + (l.lateFee || 0), 0)} ₺</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Kullanıcı</th>
                <th>E-posta</th>
                <th>Kitap</th>
                <th>Ödünç Alma</th>
                <th>Son Gün</th>
                <th>Durum</th>
                <th>Gecikme</th>
                <th>Ceza (₺)</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLoans.map(loan => `
                <tr class="${loan.daysLate > 0 ? 'overdue' : ''}">
                  <td>${loan.user?.username || ''}</td>
                  <td>${loan.user?.email || ''}</td>
                  <td>${loan.book?.title || ''}</td>
                  <td>${new Date(loan.loanDate).toLocaleDateString('tr-TR')}</td>
                  <td>${new Date(loan.dueDate).toLocaleDateString('tr-TR')}</td>
                  <td>${loan.isReturned ? 'İade Edildi' : (loan.daysLate > 0 ? 'Gecikmiş' : 'Aktif')}</td>
                  <td>${loan.daysLate > 0 ? loan.daysLate + ' gün' : '-'}</td>
                  <td>${loan.lateFee > 0 ? loan.lateFee + ' ₺' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Bu rapor Kütüphane Yönetim Sistemi tarafından otomatik olarak oluşturulmuştur.</p>
          </div>
        </body>
      </html>
    `;

    // Yeni pencerede aç ve yazdır
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    // Kısa bir gecikme sonra yazdırma dialogunu aç
    setTimeout(() => {
      printWindow.print();
      toast.success('PDF yazdırma penceresi açıldı!');
    }, 500);
  };

  const clearFilters = () => {
    setSearchUser('');
    setSearchBook('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (loan) => {
    if (loan.isReturned) {
      return <span className="badge badge-returned">İade Edildi</span>;
    }

    const daysRemaining = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return <span className="badge badge-overdue">{Math.abs(daysRemaining)} Gün Gecikmiş</span>;
    }

    if (daysRemaining <= 3) {
      return <span className="badge badge-warning">{daysRemaining} Gün Kaldı</span>;
    }

    return <span className="badge badge-active">Aktif</span>;
  };

  if (loading) {
    return (
      <div className="admin-loans-page">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="admin-loans-page">
      <div className="admin-container">
        <div className="page-header">
          <h1>📊 Ödünç Yönetimi</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <BookOpen size={32} />
            </div>
            <div className="stat-content">
              <h3>{loans.length}</h3>
              <p>Toplam Ödünç Kaydı</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <span style={{ fontSize: '40px', fontWeight: 'bold' }}>₺</span>
            </div>
            <div className="stat-content">
              <h3>{stats?.totalLateFees || 0} ₺</h3>
              <p>Geç İade Cezası</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <AlertCircle size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats?.overdueCount || 0}</h3>
              <p>Gecikmiş Kitap</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats?.topUsers?.length || 0}</h3>
              <p>Geç İade Eden Kullanıcı Sayısı</p>
            </div>
          </div>
        </div>

        {/* Top Users with Late Fees */}
        {stats?.topUsers && stats.topUsers.length > 0 && (
          <div className="top-users-section">
            <h2>🏆 En Çok Ceza Alan Kullanıcılar</h2>
            <div className="top-users-grid">
              {stats.topUsers.slice(0, 6).map((userStat, index) => (
                <div key={userStat.userId} className="top-user-card">
                  <div className="top-user-rank">#{index + 1}</div>
                  <div className="top-user-info">
                    <h4>{userStat.username}</h4>
                    <p>
                      <Mail size={14} />
                      {userStat.email}
                    </p>
                  </div>
                  <div className="top-user-stats">
                    <div className="top-user-stat">
                      <strong>{userStat.totalLateFee} ₺</strong>
                      <span>Toplam Ceza</span>
                    </div>
                    <div className="top-user-stat">
                      <strong>{userStat.lateCount}</strong>
                      <span>Gecikme</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters & Search */}
        <div className="filters-section">
          <div className="filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tümü ({loans.length})
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Aktif
            </button>
            <button
              className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilter('overdue')}
            >
              Gecikmiş
            </button>
            <button
              className={`filter-btn ${filter === 'returned' ? 'active' : ''}`}
              onClick={() => setFilter('returned')}
            >
              İade Edilmiş
            </button>
          </div>

          {/* Search & Export Actions */}
          <div className="action-buttons">
            <Button
              color="danger"
              size="sm"
              onClick={handleExportToPDF}
              disabled={filteredLoans.length === 0}
            >
              <FileText size={16} />
              PDF Rapor Oluştur
            </Button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-field">
              <label>
                <Search size={16} />
                Kullanıcı Ara
              </label>
              <input
                type="text"
                placeholder="İsim veya e-posta..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <BookOpen size={16} />
                Kitap Ara
              </label>
              <input
                type="text"
                placeholder="Kitap adı..."
                value={searchBook}
                onChange={(e) => setSearchBook(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <Calendar size={16} />
                Ödünç Alma Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <Calendar size={16} />
                Ödünç Alma Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <Button
              color="warning"
              size="sm"
              onClick={clearFilters}
              disabled={!searchUser && !searchBook && !startDate && !endDate}
            >
              Filtreleri Temizle
            </Button>
          </div>

          <div className="search-results">
            <p>
              <strong>{filteredLoans.length}</strong> kayıt bulundu
              {filteredLoans.length !== loans.length && (
                <span> (toplam {loans.length} kayıttan)</span>
              )}
            </p>
          </div>
        </div>

        {/* Loans Table */}
        <div className="loans-table-container">
          {filteredLoans.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>Arama kriterlerine uygun kayıt bulunamadı</p>
            </div>
          ) : (
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>Kitap</th>
                  <th>Ödünç Alma</th>
                  <th>Son Gün</th>
                  <th>Durum</th>
                  <th>Gecikme</th>
                  <th>Ceza</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className={loan.daysLate > 0 ? 'row-overdue' : ''}>
                    <td>
                      <div className="user-cell">
                        <strong>{loan.user?.username}</strong>
                        <small>{loan.user?.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="book-cell">
                        <BookOpen size={16} />
                        <span>{loan.book?.title}</span>
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        {new Date(loan.loanDate).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        {new Date(loan.dueDate).toLocaleDateString('tr-TR')}
                      </div>
                    </td>
                    <td>{getStatusBadge(loan)}</td>
                    <td className="text-center">
                      {loan.daysLate > 0 ? (
                        <span className="days-late">{loan.daysLate} gün</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-center">
                      {loan.lateFee > 0 ? (
                        <div className="fee-cell">
                          <strong className="fee-amount">{loan.lateFee} ₺</strong>
                          {loan.lateFeePaid && (
                            <span className="paid-badge">✓ Ödendi</span>
                          )}
                        </div>
                      ) : loan.lateFeePaid ? (
                        <span className="paid-badge">✓ Ödendi</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {loan.lateFee > 0 && !loan.lateFeePaid && (
                        <Button
                          color="warning"
                          size="sm"
                          onClick={() => handleWaiveFee(loan._id)}
                        >
                          Cezayı Sil
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminLoansPage;
