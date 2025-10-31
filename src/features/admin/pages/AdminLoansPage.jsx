import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loanService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
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
      toast.error('Bu sayfaya erişiminiz yok.');
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
        toast.error('Failed to load data.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, loading, navigate]);

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
    setConfirmModal({
      title: '🟢 Waive Late Fee',
      message: 'Are you sure you want to waive the late fee for this loan?',
      confirmText: 'Yes, Waive',
      confirmColor: 'bg-teal-600 hover:bg-teal-700',
      onConfirm: async () => {
        try {
          await loanService.waiveLateFee(loanId);
          toast.success('Late fee waived');

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
          toast.error('Error waiving fee');
          setLoading(false);
        } finally {
          setConfirmModal(null);
        }
      }
    });
  };

  const handleExportToPDF = () => {
    if (filteredLoans.length === 0) {
      toast.warning('No data to export');
      return;
    }

    // PDF content creation
    let pdfContent = `
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Loan Records Report</title>
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
          <h1>📚 DigiLibrary Loan Records Report</h1>
          <div class="header-info">
            <p><strong>Report Date:</strong> ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}</p>
            <p><strong>Total Records:</strong> ${filteredLoans.length}</p>
            <p><strong>Total Late Fee:</strong> ${filteredLoans.reduce((sum, l) => sum + (l.lateFee || 0), 0)} ₺</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Book</th>
                <th>Loan Date</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Days Late</th>
                <th>Fee (₺)</th>
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
                  <td>${loan.isReturned ? 'Returned' : (loan.daysLate > 0 ? 'Overdue' : 'Active')}</td>
                  <td>${loan.daysLate > 0 ? loan.daysLate + ' days' : '-'}</td>
                  <td>${loan.lateFee > 0 ? loan.lateFee + ' ₺' : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>This report is generated automatically by DigiLibrary.</p>
          </div>
        </body>
      </html>
    `;

    // Open in new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(pdfContent);
    printWindow.document.close();

    // Short delay then open print dialog
    setTimeout(() => {
      printWindow.print();
      toast.success('PDF print dialog opened!');
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
      return <span className="badge badge-returned">Returned</span>;
    }

    const daysRemaining = Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24));

    if (daysRemaining < 0) {
      return <span className="badge badge-overdue">{Math.abs(daysRemaining)} Days Overdue</span>;
    }

    if (daysRemaining <= 3) {
      return <span className="badge badge-warning">{daysRemaining} Days Left</span>;
    }

    return <span className="badge badge-active">Active</span>;
  };

  if (loadingData) {
    return (
      <div className="admin-loans-page">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-loans-page">
      <div className="admin-container">
        <div className="page-header">
          <h1>📊 Loan Management</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <BookOpen size={32} />
            </div>
            <div className="stat-content">
              <h3>{loans.length}</h3>
              <p>Total Loan Records</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <span style={{ fontSize: '40px', fontWeight: 'bold' }}>₺</span>
            </div>
            <div className="stat-content">
              <h3>{stats?.totalLateFees || 0} ₺</h3>
              <p>Late Return Fee</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <AlertCircle size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats?.overdueCount || 0}</h3>
              <p>Overdue Books</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats?.topUsers?.length || 0}</h3>
              <p>Users with Late Returns</p>
            </div>
          </div>
        </div>

        {/* Top Users with Late Fees */}
        {stats?.topUsers && stats.topUsers.length > 0 && (
          <div className="top-users-section">
            <h2>🏆 Top Users with Late Fees</h2>
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
                      <span>Total Fee</span>
                    </div>
                    <div className="top-user-stat">
                      <strong>{userStat.lateCount}</strong>
                      <span>Late Returns</span>
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
              All ({loans.length})
            </button>
            <button
              className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
              onClick={() => setFilter('active')}
            >
              Active
            </button>
            <button
              className={`filter-btn ${filter === 'overdue' ? 'active' : ''}`}
              onClick={() => setFilter('overdue')}
            >
              Overdue
            </button>
            <button
              className={`filter-btn ${filter === 'returned' ? 'active' : ''}`}
              onClick={() => setFilter('returned')}
            >
              Returned
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
              Create PDF Report
            </Button>
          </div>
        </div>

        {/* Search Filters */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-field">
              <label>
                <Search size={16} />
                Search User
              </label>
              <input
                type="text"
                placeholder="Name or email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <BookOpen size={16} />
                Search Book
              </label>
              <input
                type="text"
                placeholder="Book title..."
                value={searchBook}
                onChange={(e) => setSearchBook(e.target.value)}
              />
            </div>

            <div className="search-field">
              <label>
                <Calendar size={16} />
                Loan Start Date
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
                Loan End Date
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
              Clear Filters
            </Button>
          </div>

          <div className="search-results">
            <p>
              <strong>{filteredLoans.length}</strong> records found
              {filteredLoans.length !== loans.length && (
                <span> (of {loans.length} total records)</span>
              )}
            </p>
          </div>
        </div>

        {/* Loans Table */}
        <div className="loans-table-container">
          {filteredLoans.length === 0 ? (
            <div className="empty-state">
              <AlertCircle size={48} />
              <p>No records found matching the search criteria</p>
            </div>
          ) : (
            <table className="loans-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Book</th>
                  <th>Loan Date</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Days Late</th>
                  <th>Fee</th>
                  <th>Actions</th>
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
                        <span className="days-late">{loan.daysLate} days</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="text-center">
                      {loan.lateFee > 0 ? (
                        <div className="fee-cell">
                          <strong className="fee-amount">{loan.lateFee} ₺</strong>
                          {loan.lateFeePaid && (
                            <span className="paid-badge">✓ Paid</span>
                          )}
                        </div>
                      ) : loan.lateFeePaid ? (
                        <span className="paid-badge">✓ Paid</span>
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
                          Waive Fee
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
