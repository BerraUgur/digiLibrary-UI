import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, messageService } from '../../../services';
import { useAuth } from '../../auth/context/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { toast } from 'react-toastify';
import { Users, Mail, Calendar, Shield, Ban, Edit2, Trash2, Search, UserCheck, X, Send, AlertTriangle } from 'lucide-react';
import Button from '../../../components/UI/buttons/Button';
import '../styles/AdminUsersPage.css';
import { ROLES } from '../../../constants/rolesConstants';
import remoteLogger from '../../../utils/remoteLogger';

function AdminUsersPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // Filter options: all, user, admin
  const [banFilter, setBanFilter] = useState('all'); // Filter options: all, banned, active

  // Email Modal States
  const [emailModal, setEmailModal] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sending, setSending] = useState(false);

  // Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState(null); // { type, title, message, onConfirm, confirmText, confirmColor }
  const [banDays, setBanDays] = useState('7');

  const loadUsers = useCallback(async () => {
    try {
      setLoadingUsers(true);
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch {
      toast.error(t.adminUsers.errorLoadingUsers);
    } finally {
      setLoadingUsers(false);
    }
  }, [t.adminUsers.errorLoadingUsers]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (user && user.role !== ROLES.ADMIN) {
      toast.error(t.adminUsers.noPermission);
      navigate('/');
      return;
    }

    loadUsers();
  }, [user, loading, navigate, t.adminUsers.noPermission, loadUsers]);

  // Filter users
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    // Ban filter
    if (banFilter === 'banned') {
      filtered = filtered.filter(u => u.banUntil && new Date(u.banUntil) > new Date());
    } else if (banFilter === 'active') {
      filtered = filtered.filter(u => !u.banUntil || new Date(u.banUntil) <= new Date());
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, banFilter]);

  const handleDeleteUser = (userId) => {
    setConfirmModal({
      type: 'delete',
      title: t.adminUsers.deleteUserTitle,
      message: t.adminUsers.deleteUserMessage,
      confirmText: t.adminUsers.yesDelete,
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await userService.deleteUser(userId);
          toast.success(t.adminUsers.userDeleted);
          loadUsers();
          setConfirmModal(null);
        } catch (error) {
          remoteLogger.error('User delete error', { error: error?.message || String(error), stack: error?.stack });
          toast.error(t.adminUsers.errorDeletingUser);
        }
      }
    });
  };

  const handleToggleRole = (userId, currentRole) => {
    const newRole = currentRole === ROLES.ADMIN ? ROLES.USER : ROLES.ADMIN;

    setConfirmModal({
      type: 'role',
      title: currentRole === ROLES.ADMIN ? t.adminUsers.removeAdminTitle : t.adminUsers.grantAdminTitle,
      message: t.adminUsers.changeRoleMessage.replace('{role}', newRole === ROLES.ADMIN ? t.adminUsers.admin : t.adminUsers.userRole),
      confirmText: t.adminUsers.yesChange,
      confirmColor: currentRole === ROLES.ADMIN ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700',
      onConfirm: async () => {
        try {
          await userService.updateUser(userId, { role: newRole });
          toast.success(newRole === ROLES.ADMIN ? t.adminUsers.roleUpdatedToAdmin : t.adminUsers.roleUpdatedToUser);
          loadUsers();
          setConfirmModal(null);
        } catch (error) {
          remoteLogger.error('User role update error', { error: error?.message || String(error), stack: error?.stack });
          toast.error(t.adminUsers.errorUpdatingRole);
        }
      }
    });
  };

  const handleToggleBan = (userId, currentBanUntil, userRole) => {
    // Admins cannot be banned!
    if (userRole === ROLES.ADMIN) {
      toast.error(t.adminUsers.adminCannotBeBanned);
      return;
    }

    const isBanned = currentBanUntil && new Date(currentBanUntil) > new Date();

    if (isBanned) {
      // Remove ban
      setConfirmModal({
        type: 'unban',
        title: t.adminUsers.removeBanTitle,
        message: t.adminUsers.removeBanMessage,
        confirmText: t.adminUsers.yesRemove,
        confirmColor: 'bg-teal-600 hover:bg-teal-700',
        onConfirm: async () => {
          try {
            await userService.updateUser(userId, { banUntil: null });
            toast.success(t.adminUsers.banRemoved);
            loadUsers();
            setConfirmModal(null);
          } catch (error) {
            remoteLogger.error('Remove ban error', { error: error?.message || String(error), stack: error?.stack });
            toast.error(t.adminUsers.errorRemovingBan);
          }
        }
      });
    } else {
      // Add ban - ask for number of days via modal
      setConfirmModal({
        type: 'ban',
        title: t.adminUsers.banUserTitle,
        message: '',
        needsInput: true,
        inputLabel: t.adminUsers.banDaysLabel,
        inputPlaceholder: t.adminUsers.banDaysPlaceholder,
        confirmText: t.adminUsers.banButton,
        confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
        onConfirm: async (days) => {
          if (!days || isNaN(days) || parseInt(days) <= 0) {
            toast.error(t.adminUsers.enterValidDays);
            return;
          }

          const banUntil = new Date();
          banUntil.setDate(banUntil.getDate() + parseInt(days));

          try {
            await userService.updateUser(userId, { banUntil: banUntil.toISOString() });
            toast.success(t.adminUsers.userBannedForDays.replace('{days}', days));
            loadUsers();
            setConfirmModal(null);
          } catch (error) {
            remoteLogger.error('Ban user error', { error: error?.message || String(error), stack: error?.stack });
            toast.error(t.adminUsers.errorBanningUser);
          }
        }
      });
    }
  };

  const openEmailModal = (userEmail, username) => {
    setEmailModal({ email: userEmail, username: username });
    setEmailSubject('');
    setEmailMessage('');
  };

  const closeEmailModal = () => {
    setEmailModal(null);
    setEmailSubject('');
    setEmailMessage('');
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast.error(t.adminUsers.fillSubjectAndMessage);
      return;
    }

    try {
      setSending(true);
      await messageService.sendNewMessage(emailModal.email, emailSubject, emailMessage);
      toast.success(t.adminUsers.emailSentSuccess);
      closeEmailModal();
      loadUsers(); // Refresh user list
    } catch (error) {
      remoteLogger.error('Email send error', { error: error?.message || String(error), stack: error?.stack });
      toast.error(error.message || t.adminUsers.emailSendFailed);
    } finally {
      setSending(false);
    }
  };

  const getUserBadge = (u) => {
    const isBanned = u.banUntil && new Date(u.banUntil) > new Date();

    if (isBanned) {
      return <span className="badge badge-overdue">{t.adminUsers.banned}</span>;
    }

    if (u.role === ROLES.ADMIN) {
      return <span className="badge badge-active">{t.adminUsers.admin}</span>;
    }

    return <span className="badge badge-returned">{t.adminUsers.userRole}</span>;
  };

  if (loadingUsers) {
    return (
      <div className="admin-loans-page">
        <div className="loading">{t.adminUsers.loading}</div>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === ROLES.ADMIN).length,
    bannedUsers: users.filter(u => u.banUntil && new Date(u.banUntil) > new Date()).length,
    activeUsers: users.filter(u => u.role === ROLES.USER && (!u.banUntil || new Date(u.banUntil) <= new Date())).length,
  };

  return (
    <div className="admin-loans-page">
      <div className="admin-container">
        <div className="page-header">
          <h1>👥 {t.adminUsers.title}</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>{t.adminUsers.totalUsers}</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <Shield size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.admins}</h3>
              <p>{t.adminUsers.adminCount}</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <UserCheck size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.activeUsers}</h3>
              <p>{t.adminUsers.activeUsers}</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <Ban size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.bannedUsers}</h3>
              <p>{t.adminUsers.bannedUsers}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters">
            <button
              className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              {t.adminUsers.all}
            </button>
            <button
              className={`filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >
              {t.adminUsers.users}
            </button>
            <button
              className={`filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              {t.adminUsers.admins}
            </button>
          </div>

          <div className="filters">
            <button
              className={`filter-btn ${banFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBanFilter('all')}
            >
              {t.adminUsers.allStatuses}
            </button>
            <button
              className={`filter-btn ${banFilter === 'active' ? 'active' : ''}`}
              onClick={() => setBanFilter('active')}
            >
              {t.adminUsers.active}
            </button>
            <button
              className={`filter-btn ${banFilter === 'banned' ? 'active' : ''}`}
              onClick={() => setBanFilter('banned')}
            >
              {t.adminUsers.banned}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-field" style={{ flex: 1 }}>
              <label>
                <Search size={16} />
                {t.adminUsers.searchUser}
              </label>
              <input
                type="text"
                placeholder={t.adminUsers.nameOrEmail}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              color="warning"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setBanFilter('all');
              }}
              disabled={!searchTerm && roleFilter === 'all' && banFilter === 'all'}
            >
              {t.adminUsers.clearFilters}
            </Button>
          </div>

          <div className="search-results">
            <p>
              <strong>{filteredUsers.length}</strong> {t.adminUsers.usersFound}
              {filteredUsers.length !== users.length && (
                <span> ({t.adminUsers.outOfTotal} {users.length})</span>
              )}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="loans-table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>{t.adminUsers.noUsersFound}</p>
            </div>
          ) : (
            <table className="loans-table">
              <thead>
                <tr>
                  <th>{t.adminUsers.user}</th>
                  <th>{t.adminUsers.email}</th>
                  <th>{t.adminUsers.registrationDate}</th>
                  <th>{t.adminUsers.role}</th>
                  <th>{t.adminUsers.status}</th>
                  <th>{t.adminUsers.banEnd}</th>
                  <th>{t.adminUsers.actions}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isBanned = u.banUntil && new Date(u.banUntil) > new Date();
                  return (
                    <tr key={u._id} className={isBanned ? 'row-overdue' : ''}>
                      <td>
                        <div className="user-cell">
                          <strong>{u.username}</strong>
                        </div>
                      </td>
                      <td>
                        <div className="book-cell">
                          <Mail size={16} />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td>
                        <div className="date-cell">
                          <Calendar size={14} />
                          {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(u.createdAt))}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === ROLES.ADMIN ? 'badge-active' : 'badge-returned'}`}>
                          {u.role === ROLES.ADMIN ? t.adminUsers.admin : t.adminUsers.userRole}
                        </span>
                      </td>
                      <td>{getUserBadge(u)}</td>
                      <td className="text-center">
                        {isBanned ? (
                          <span className="days-late">
                            {new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(u.banUntil))}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => openEmailModal(u.email, u.username)}
                            className="px-3 py-1.5 text-sm bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded flex items-center gap-1.5 transition"
                          >
                            <Mail size={14} />
                            {t.adminUsers.sendEmail}
                          </button>

                          <button
                            onClick={() => handleToggleRole(u._id, u.role)}
                            disabled={u._id === user.id}
                            className={`px-3 py-1.5 text-sm text-white rounded flex items-center gap-1.5 transition ${u._id === user.id
                                ? 'bg-gray-400 cursor-not-allowed'
                                : u.role === ROLES.ADMIN
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                              }`}
                          >
                            <Edit2 size={14} />
                            {u.role === ROLES.ADMIN ? t.adminUsers.removeAdminPrivilege : t.adminUsers.grantAdminPrivilege}
                          </button>

                          <button
                            onClick={() => handleToggleBan(u._id, u.banUntil, u.role)}
                            disabled={u._id === user.id || u.role === ROLES.ADMIN}
                            className={`px-3 py-1.5 text-sm text-white rounded flex items-center gap-1.5 transition ${u._id === user.id || u.role === ROLES.ADMIN
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isBanned
                                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
                                  : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600'
                              }`}
                          >
                            <Ban size={14} />
                            {isBanned ? t.adminUsers.removeBan : t.adminUsers.ban}
                          </button>

                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === user.id || u.role === ROLES.ADMIN}
                          >
                            <Trash2 size={14} />
                            {t.adminUsers.delete}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {emailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t.adminUsers.sendNewMessage}</h3>
              <button
                onClick={closeEmailModal}
                className="text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-700 dark:text-slate-200 mb-1">
                  <strong>{t.adminUsers.recipient}:</strong> {emailModal.username} ({emailModal.email})
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-300 mt-2">
                  {t.adminUsers.emailSentTo}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.adminUsers.subject} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-slate-900 dark:text-slate-100"
                  placeholder={t.adminUsers.subjectPlaceholder}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  {t.adminUsers.message} <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows="10"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none dark:bg-slate-900 dark:text-slate-100"
                  placeholder={t.adminUsers.messagePlaceholder}
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {t.adminUsers.minCharacters}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeEmailModal}
                  className="px-5 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium"
                  disabled={sending}
                >
                  {t.adminUsers.cancel}
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !emailSubject || emailSubject.trim().length < 3 || !emailMessage || emailMessage.trim().length < 10}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t.adminUsers.sending}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t.adminUsers.sendMessage}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} className="text-yellow-600" />
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100 text-center mb-2">
                {confirmModal.title}
              </h3>

              {confirmModal.message && (
                <p className="text-gray-600 dark:text-slate-300 text-center mb-6">
                  {confirmModal.message}
                </p>
              )}

              {confirmModal.needsInput && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                    {confirmModal.inputLabel}
                  </label>
                  <input
                    type="number"
                    value={banDays}
                    onChange={(e) => setBanDays(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-slate-900 dark:text-slate-100"
                    placeholder={confirmModal.inputPlaceholder}
                    min="1"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmModal(null);
                    setBanDays('7');
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium"
                >
                  {t.adminUsers.cancel}
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.needsInput) {
                      confirmModal.onConfirm(banDays);
                    } else {
                      confirmModal.onConfirm();
                    }
                  }}
                  className={`flex-1 px-4 py-2.5 text-white rounded-lg transition font-medium ${confirmModal.confirmColor}`}
                >
                  {confirmModal.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
