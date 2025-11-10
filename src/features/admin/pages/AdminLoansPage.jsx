import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/useLanguage';
import { toast } from 'react-toastify';
import { AlertCircle, Users, Calendar, BookOpen, Mail, Search, FileText } from 'lucide-react';
import ConfirmModal from '../../../components/UI/modals/ConfirmModal';
import Button from '../../../components/UI/buttons/Button';
import '../styles/AdminLoansPage.css';
import { ROLES } from '../../../constants/rolesConstants';
import remoteLogger from '../../../utils/remoteLogger';

function AdminLoansPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t, getLocalizedText } = useLanguage();
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // Filter options: all, active, overdue, returned
  const [searchUser, setSearchUser] = useState('');
  const [searchBook, setSearchBook] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [confirmModal, setConfirmModal] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user && user.role !== ROLES.ADMIN) {
      toast.error(t.adminLoans.noPermission);
      navigate('/');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        const [loansData, statsData] = await Promise.all([
          loanService.getAllLoansAdmin({}), // Fetch all data and filter on the frontend
          loanService.getLateFeeStats(),
        ]);
        setLoans(loansData);
        setStats(statsData);
      } catch {
        toast.error(t.adminLoans.failedToLoadData);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, loading, navigate, t.adminLoans.failedToLoadData, t.adminLoans.noPermission]);

  // Filter loans based on search criteria
  useEffect(() => {
    let filtered = loans;

    // Status filter (All, Active, Overdue, Returned)
    if (filter === 'active') {
      filtered = filtered.filter(loan => !loan.isReturned && (loan.daysLate === 0 || !loan.daysLate));
    } else if (filter === 'overdue') {
      filtered = filtered.filter(loan => !loan.isReturned && loan.daysLate > 0);
    } else if (filter === 'returned') {
      filtered = filtered.filter(loan => loan.isReturned);
    }
    // 'all' shows all

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
        loan.book?.title_tr?.toLowerCase().includes(searchBook.toLowerCase()) ||
        loan.book?.title_en?.toLowerCase().includes(searchBook.toLowerCase())
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
    setConfirmModal({
      title: t.adminLoans.waiveFeeTitle,
      message: t.adminLoans.waiveFeeMessage,
      confirmText: t.adminLoans.yesWaive,
      confirmColor: 'bg-teal-600 hover:bg-teal-700',
      onConfirm: async () => {
        try {
          await loanService.waiveLateFee(loanId);
          toast.success(t.adminLoans.lateFeWaived);

          // Refresh data - Fetch all data, filtering will be done in useEffect
          setLoading(true);
          const [loansData, statsData] = await Promise.all([
            loanService.getAllLoansAdmin({}), // Empty object to fetch all data
            loanService.getLateFeeStats(),
          ]);
          setLoans(loansData);
          setStats(statsData);
          setLoading(false);
        } catch (error) {
          remoteLogger.error('Error waiving fee', { error: error?.message || String(error), stack: error?.stack });
          toast.error(t.adminLoans.errorWaivingFee);
          setLoading(false);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleExportToPDF = () => {
    if (filteredLoans.length === 0) {
      toast.warning(t.adminLoans.noDataToExport);
      return;
    }

    // PDF content creation
    let pdfContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${t.adminLoans.pdfTitle}</title>
          <style>
            @media print {
              @page { 
                margin: 10mm;
                size: A4 landscape;
              }
              body { margin: 0; padding: 10px; }
            }
            @page { margin: 0; }
            body { font-family: Arial, sans-serif; padding: 20px; margin: 0; }
            h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; margin-top: 0; font-size: 24px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 10px; }
            th { background-color: #3498db; color: white; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            .overdue { background-color: #ffebee !important; }
            .header-info { margin-bottom: 20px; font-size: 13px; }
            .header-info p { margin: 5px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; page-break-after: avoid; }
            .paid { color: #10b981; font-weight: bold; }
            .unpaid { color: #dc3545; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>📚 ${t.adminLoans.pdfTitle}</h1>
          <div class="header-info">
            <p><strong>${t.adminLoans.reportDate}:</strong> ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
            <p><strong>${t.adminLoans.totalRecords}:</strong> ${filteredLoans.length}</p>
            <p><strong>${t.adminLoans.totalPaidFee || 'Toplam Ödenen Ücret'}:</strong> ${filteredLoans.reduce((sum, l) => sum + (l.lateFeePaid ? l.lateFee || 0 : 0), 0)} ₺</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>${t.adminLoans.pdfUser}</th>
                <th>${t.adminLoans.pdfEmail}</th>
                <th>${t.adminLoans.pdfBook}</th>
                <th>${t.adminLoans.pdfLoanDate}</th>
                <th>${t.adminLoans.pdfDueDate}</th>
                <th>${t.adminLoans.pdfReturnDate || 'İade Tarihi'}</th>
                <th>${t.adminLoans.pdfStatus}</th>
                <th>${t.adminLoans.pdfDaysLate}</th>
                <th>${t.adminLoans.totalLateFee}</th>
                <th>${t.adminLoans.pdfPaymentDate || 'Ödeme Tarihi'}</th>
                <th>${t.adminLoans.pdfPaymentMethod || 'Ödeme Yöntemi'}</th>
              </tr>
            </thead>
            <tbody>
              ${filteredLoans.map(loan => `
                <tr class="${loan.daysLate > 0 && !loan.lateFeePaid ? 'overdue' : ''}">
                  <td>${loan.user?.username || ''}</td>
                  <td>${loan.user?.email || ''}</td>
                  <td>${getLocalizedText(loan.book, 'title') || ''}</td>
                  <td>${new Date(loan.loanDate).toLocaleDateString('tr-TR')}</td>
                  <td>${new Date(loan.dueDate).toLocaleDateString('tr-TR')}</td>
                  <td>${loan.returnDate ? new Date(loan.returnDate).toLocaleDateString('tr-TR') : '-'}</td>
                  <td>${loan.isReturned ? t.adminLoans.pdfReturned : (loan.daysLate > 0 ? t.adminLoans.pdfOverdue : t.adminLoans.pdfActive)}</td>
                  <td>${loan.daysLate > 0 ? loan.daysLate + ' ' + (t.adminLoans.days || 'gün') : '-'}</td>
                  <td>${loan.lateFee > 0 ? '<span class="' + (loan.lateFeePaid ? 'paid' : 'unpaid') + '">' + loan.lateFee + ' ₺</span>' : '-'}</td>
                  <td>${loan.lateFeePaid && loan.lateFeePaymentDate ? new Date(loan.lateFeePaymentDate).toLocaleDateString('tr-TR') : loan.lateFee > 0 && !loan.lateFeePaid ? (t.adminLoans.unpaid || 'Ödenmedi') : '-'}</td>
                  <td>${loan.lateFeePaid && loan.paymentMethod ? (loan.paymentMethod === 'stripe' ? 'Stripe' : 'Iyzico') : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>${t.adminLoans.pdfFooter}</p>
          </div>
        </body>
      </html>
    `;

    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    // Show success message immediately
    toast.success(t.adminLoans.pdfOpened);

    // Short delay then open print dialog
    setTimeout(() => {
      // Set document title to empty or report name only (minimizes header text)
      printWindow.document.title = '';

      // Use try-catch to prevent blocking if print dialog is cancelled
      try {
        printWindow.print();
      } catch (error) {
        remoteLogger.warn('Print dialog error', { error: error.message });
      }
    }, 300);
  };

  const clearFilters = () => {
    setSearchUser('');
    setSearchBook('');
    setStartDate('');
    setEndDate('');
  };

  const getStatusBadge = (loan) => {
    if (loan.isReturned) {
      return <span className="badge badge-returned">{t.adminLoans.returned}</span>;
    }

    // Use server's daysLate value if available (more reliable)
    if (loan.daysLate && loan.daysLate > 0) {
      return <span className="badge badge-overdue">{loan.daysLate} {t.adminLoans.daysOverdue}</span>;
    }

    // Calculate remaining days for active loans
    const daysRemaining = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      // Fallback: if server didn't provide daysLate but book is overdue
      return <span className="badge badge-overdue">{Math.abs(daysRemaining)} {t.adminLoans.daysOverdue}</span>;
    }

    if (daysRemaining <= 3) {
      return <span className="badge badge-warning">{daysRemaining} {t.adminLoans.daysLeft}</span>;
    }

    return <span className="badge badge-active">{t.adminLoans.active}</span>;
  };

  if (loadingData) {
    return (
      <div className="admin-loans-page">
        <div className="loading">{t.adminLoans.loading}</div>
      </div>
    );
  }

  return (
    <div className="admin-loans-page">
      <div className="admin-container">
        <div className="page-header">
          <h1>📊 {t.adminLoans.title}</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <BookOpen size={32} />
            </div>
            <div className="stat-content">
              <h3>{loans.length}</h3>
              <p>{t.adminLoans.totalLoanRecords}</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <span style={{ fontSize: '40px', fontWeight: 'bold' }}>₺</span>
            </div>
            <div className="stat-content">
              <h3>{stats?.totalLateFees || 0} ₺</h3>
              <p>{t.adminLoans.lateReturnFee}</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <AlertCircle size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats?.overdueCount || 0}</h3>
              <p>{t.adminLoans.overdueBooks}</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats?.topUsers?.length || 0}</h3>
              <p>{t.adminLoans.usersWithLateReturns}</p>
            </div>
          </div>
        </div>

        {/* Top Users with Late Fees */}
        {stats?.topUsers && stats.topUsers.length > 0 && (
          <div className="top-users-section">
            <h2>{t.adminLoans.topUsersWithLateFees}</h2>
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
                      <span>{t.adminLoans.totalFee}</span>
                    </div>
                    <div className="top-user-stat">
                      <strong>{userStat.lateCount}</strong>
                      <span>{t.adminLoans.lateReturns}</span>
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
              {t.adminLoans.all} ({loans.length})
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              {t.adminLoans.active}
            </button>
            <button
              className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilter('overdue')}
            >
              {t.adminLoans.overdue}
            </button>
            <button
              className={`filter-btn ${filter === 'returned' ? 'active' : ''}`}
              onClick={() => setFilter('returned')}
            >
              {t.adminLoans.returned}
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
              {t.adminLoans.createPdfReport}
            </Button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-field">
              <label>
                <Search size={16} />
                {t.adminLoans.searchUser}
              </label>
              <input
                type="text"
                placeholder={t.adminLoans.nameOrEmail}
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <BookOpen size={16} />
                {t.adminLoans.searchBook}
              </label>
              <input
                type="text"
                placeholder={t.adminLoans.bookTitle}
                value={searchBook}
                onChange={(e) => setSearchBook(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <Calendar size={16} />
                {t.adminLoans.loanStartDate}
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
                {t.adminLoans.loanEndDate}
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
              {t.adminLoans.clearFilters}
            </Button>
          </div>

          <div className="search-results">
            <p>
              <strong>{filteredLoans.length}</strong> {t.adminLoans.recordsFound}
              {filteredLoans.length !== loans.length && (
                <span> ({t.adminLoans.ofTotalRecords} {loans.length})</span>
              )}
            </p>
          </div>
        </div>

        {/* Loans Table */}
        <div className="loans-table-container">
          {filteredLoans.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>{t.adminLoans.noRecordsFound}</p>
            </div>
          ) : (
            <table className="loans-table">
              <thead>
                <tr>
                  <th>{t.adminLoans.user}</th>
                  <th>{t.adminLoans.book}</th>
                  <th>{t.adminLoans.loanDate}</th>
                  <th>{t.adminLoans.dueDate}</th>
                  <th>{t.adminLoans.returnDate}</th>
                  <th>{t.adminLoans.status}</th>
                  <th>{t.adminLoans.daysLate}</th>
                  <th>{t.adminLoans.totalLateFee}</th>
                  <th>{t.adminLoans.paymentDate}</th>
                  <th>{t.adminLoans.paymentMethod}</th>
                  <th>{t.adminLoans.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan._id} className={loan.daysLate > 0 && !loan.lateFeePaid ? 'row-overdue' : ''}>
                    <td>
                      <div className="user-cell">
                        <strong>{loan.user?.username}</strong>
                        <small>{loan.user?.email}</small>
                      </div>
                    </td>
                    <td>
                      <div className="book-cell">
                        <BookOpen size={16} />
                        <span>{getLocalizedText(loan.book, 'title')}</span>
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
                    <td>
                      {loan.returnDate ? (
                        <div className="date-cell">
                          <Calendar size={14} />
                          {new Date(loan.returnDate).toLocaleDateString('tr-TR')}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{getStatusBadge(loan)}</td>
                    <td className="text-center">
                      {loan.daysLate > 0 ? (
                        <span className="days-late">{loan.daysLate} {t.adminLoans.days}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-center">
                      {loan.lateFee > 0 ? (
                        <strong className="fee-amount">{loan.lateFee} ₺</strong>
                      ) : loan.lateFeePaid && loan.lateFee === 0 ? (
                        <span className="fee-waived">Affedildi</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-center">
                      {loan.lateFeePaid && loan.lateFeePaymentDate ? (
                        <div className="date-cell">
                          <Calendar size={14} />
                          {new Date(loan.lateFeePaymentDate).toLocaleDateString('tr-TR')}
                        </div>
                      ) : loan.lateFee > 0 && !loan.lateFeePaid ? (
                        <span className="unpaid-label">❌ {t.adminLoans.unpaid || 'Ödenmedi'}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-center">
                      {loan.lateFeePaid && loan.paymentMethod ? (
                        <span className={`payment-method-badge ${loan.paymentMethod === 'stripe' ? 'paid-stripe' : 'paid-iyzico'}`}>
                          {loan.paymentMethod === 'stripe' ? 'Stripe' : 'Iyzico'}
                        </span>
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
                          {t.adminLoans.waiveFee}
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
      {confirmModal && (
        <ConfirmModal
          open={!!confirmModal}
          title={confirmModal?.title}
          message={confirmModal?.message}
          confirmText={confirmModal?.confirmText}
          confirmColor={confirmModal?.confirmColor}
          onConfirm={() => { confirmModal?.onConfirm && confirmModal.onConfirm(); }}
          onCancel={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
}

export default AdminLoansPage;
