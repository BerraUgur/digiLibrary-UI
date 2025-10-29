import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService, messageService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { Users, Mail, Calendar, Shield, Ban, Edit2, Trash2, Search, UserCheck, X, Send, AlertTriangle } from 'lucide-react';
import Button from '../components/UI/Button';
import './AdminLoansPage.css'; // Aynı stil dosyasını kullanıyoruz

function AdminUsersPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // all, user, admin
  const [banFilter, setBanFilter] = useState('all'); // all, banned, active
  
  // Email Modal States
  const [emailModal, setEmailModal] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  // Confirmation Modal States
  const [confirmModal, setConfirmModal] = useState(null); // { type, title, message, onConfirm, confirmText, confirmColor }
  const [banDays, setBanDays] = useState('7');

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

    loadUsers();
  }, [user, navigate]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Kullanıcılar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

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
      title: '🗑️ Kullanıcıyı Sil',
      message: 'Bu kullanıcıyı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      confirmText: 'Evet, Sil',
      confirmColor: 'bg-red-600 hover:bg-red-700',
      onConfirm: async () => {
        try {
          await userService.deleteUser(userId);
          toast.success('Kullanıcı başarıyla silindi');
          loadUsers();
          setConfirmModal(null);
        } catch (error) {
          console.error('Error deleting user:', error);
          toast.error('Kullanıcı silinirken hata oluştu');
        }
      }
    });
  };

  const handleToggleRole = (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    setConfirmModal({
      type: 'role',
      title: currentRole === 'admin' ? '👤 Kullanıcı Yap' : '👑 Admin Yap',
      message: `Bu kullanıcıyı ${newRole === 'admin' ? 'Admin' : 'Kullanıcı'} yapmak istediğinizden emin misiniz?`,
      confirmText: 'Evet, Değiştir',
      confirmColor: currentRole === 'admin' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700',
      onConfirm: async () => {
        try {
          await userService.updateUser(userId, { role: newRole });
          toast.success(`Kullanıcı rolü ${newRole === 'admin' ? 'Admin' : 'Kullanıcı'} olarak güncellendi`);
          loadUsers();
          setConfirmModal(null);
        } catch (error) {
          console.error('Error updating user role:', error);
          toast.error('Rol güncellenirken hata oluştu');
        }
      }
    });
  };

  const handleToggleBan = (userId, currentBanUntil, userRole) => {
    // Admin'e ban atılamaz!
    if (userRole === 'admin') {
      toast.error('Admin kullanıcılar yasaklanamaz!');
      return;
    }

    const isBanned = currentBanUntil && new Date(currentBanUntil) > new Date();
    
    if (isBanned) {
      // Remove ban
      setConfirmModal({
        type: 'unban',
        title: '✅ Yasağı Kaldır',
        message: 'Bu kullanıcının yasağını kaldırmak istediğinizden emin misiniz?',
        confirmText: 'Evet, Kaldır',
        confirmColor: 'bg-teal-600 hover:bg-teal-700',
        onConfirm: async () => {
          try {
            await userService.updateUser(userId, { banUntil: null });
            toast.success('Kullanıcının yasağı kaldırıldı');
            loadUsers();
            setConfirmModal(null);
          } catch (error) {
            console.error('Error removing ban:', error);
            toast.error('Yasak kaldırılırken hata oluştu');
          }
        }
      });
    } else {
      // Add ban - modal ile gün sayısı al
      setConfirmModal({
        type: 'ban',
        title: '🚫 Kullanıcıyı Yasakla',
        message: '',
        needsInput: true,
        inputLabel: 'Kaç gün yasaklamak istiyorsunuz?',
        inputPlaceholder: '7',
        confirmText: 'Yasakla',
        confirmColor: 'bg-yellow-500 hover:bg-yellow-600',
        onConfirm: async (days) => {
          if (!days || isNaN(days) || parseInt(days) <= 0) {
            toast.error('Lütfen geçerli bir gün sayısı girin!');
            return;
          }

          const banUntil = new Date();
          banUntil.setDate(banUntil.getDate() + parseInt(days));

          try {
            await userService.updateUser(userId, { banUntil: banUntil.toISOString() });
            toast.success(`Kullanıcı ${days} gün boyunca yasaklandı`);
            loadUsers();
            setConfirmModal(null);
          } catch (error) {
            console.error('Error banning user:', error);
            toast.error('Kullanıcı yasaklanırken hata oluştu');
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
      toast.error('Lütfen konu ve mesaj alanlarını doldurun!');
      return;
    }

    try {
      setSending(true);
      await messageService.sendNewMessage(emailModal.email, emailSubject, emailMessage);
      toast.success('Email başarıyla gönderildi! 📧');
      closeEmailModal();
      loadUsers(); // Listeyi yenile
    } catch (error) {
      console.error('Email gönderme hatası:', error);
      toast.error(error.message || 'Email gönderilemedi!');
    } finally {
      setSending(false);
    }
  };

  const getUserBadge = (u) => {
    const isBanned = u.banUntil && new Date(u.banUntil) > new Date();
    
    if (isBanned) {
      return <span className="badge badge-overdue">Yasaklı</span>;
    }
    
    if (u.role === 'admin') {
      return <span className="badge badge-active">Admin</span>;
    }
    
    return <span className="badge badge-returned">Kullanıcı</span>;
  };

  if (loading) {
    return (
      <div className="admin-loans-page">
        <div className="loading">Yükleniyor...</div>
      </div>
    );
  }

  const stats = {
    totalUsers: users.length,
    admins: users.filter(u => u.role === 'admin').length,
    bannedUsers: users.filter(u => u.banUntil && new Date(u.banUntil) > new Date()).length,
    activeUsers: users.filter(u => u.role === 'user' && (!u.banUntil || new Date(u.banUntil) <= new Date())).length,
  };

  return (
    <div className="admin-loans-page">
      <div className="admin-container">
        <div className="page-header">
          <h1>👥 Kullanıcı Yönetimi</h1>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card stat-primary">
            <div className="stat-icon">
              <Users size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.totalUsers}</h3>
              <p>Toplam Kullanıcı</p>
            </div>
          </div>

          <div className="stat-card stat-info">
            <div className="stat-icon">
              <Shield size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.admins}</h3>
              <p>Admin Sayısı</p>
            </div>
          </div>

          <div className="stat-card stat-warning">
            <div className="stat-icon">
              <UserCheck size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.activeUsers}</h3>
              <p>Aktif Kullanıcı</p>
            </div>
          </div>

          <div className="stat-card stat-danger">
            <div className="stat-icon">
              <Ban size={32} />
            </div>
            <div className="stat-content">
              <h3>{stats.bannedUsers}</h3>
              <p>Yasaklı Kullanıcı</p>
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
              Tümü
            </button>
            <button
              className={`filter-btn ${roleFilter === 'user' ? 'active' : ''}`}
              onClick={() => setRoleFilter('user')}
            >
              Kullanıcılar
            </button>
            <button
              className={`filter-btn ${roleFilter === 'admin' ? 'active' : ''}`}
              onClick={() => setRoleFilter('admin')}
            >
              Adminler
            </button>
          </div>

          <div className="filters">
            <button
              className={`filter-btn ${banFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBanFilter('all')}
            >
              Tüm Durumlar
            </button>
            <button
              className={`filter-btn ${banFilter === 'active' ? 'active' : ''}`}
              onClick={() => setBanFilter('active')}
            >
              Aktif
            </button>
            <button
              className={`filter-btn ${banFilter === 'banned' ? 'active' : ''}`}
              onClick={() => setBanFilter('banned')}
            >
              Yasaklı
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="search-filters">
          <div className="search-row">
            <div className="search-field" style={{ flex: 1 }}>
              <label>
                <Search size={16} />
                Kullanıcı Ara
              </label>
              <input
                type="text"
                placeholder="İsim veya e-posta..."
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
              Filtreleri Temizle
            </Button>
          </div>

          <div className="search-results">
            <p>
              <strong>{filteredUsers.length}</strong> kullanıcı bulundu
              {filteredUsers.length !== users.length && (
                <span> (toplam {users.length} kullanıcıdan)</span>
              )}
            </p>
          </div>
        </div>

        {/* Users Table */}
        <div className="loans-table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Users size={48} />
              <p>Arama kriterlerine uygun kullanıcı bulunamadı</p>
            </div>
          ) : (
            <table className="loans-table">
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>E-posta</th>
                  <th>Kayıt Tarihi</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>Yasak Bitiş</th>
                  <th>İşlemler</th>
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
                          {new Date(u.createdAt).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${u.role === 'admin' ? 'badge-active' : 'badge-returned'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Kullanıcı'}
                        </span>
                      </td>
                      <td>{getUserBadge(u)}</td>
                      <td className="text-center">
                        {isBanned ? (
                          <span className="days-late">
                            {new Date(u.banUntil).toLocaleDateString('tr-TR')}
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
                            Mail At
                          </button>

                          <button
                            onClick={() => handleToggleRole(u._id, u.role)}
                            disabled={u._id === user.id}
                            className={`px-3 py-1.5 text-sm text-white rounded flex items-center gap-1.5 transition ${
                              u._id === user.id 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : u.role === 'admin' 
                                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                                  : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
                            }`}
                          >
                            <Edit2 size={14} />
                            {u.role === 'admin' ? 'Kullanıcı Yap' : 'Admin Yap'}
                          </button>
                          
                          <button
                            onClick={() => handleToggleBan(u._id, u.banUntil, u.role)}
                            disabled={u._id === user.id || u.role === 'admin'}
                            className={`px-3 py-1.5 text-sm text-white rounded flex items-center gap-1.5 transition ${
                              u._id === user.id || u.role === 'admin'
                                ? 'bg-gray-400 cursor-not-allowed'
                                : isBanned
                                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
                                  : 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600'
                            }`}
                          >
                            <Ban size={14} />
                            {isBanned ? 'Yasağı Kaldır' : 'Yasakla'}
                          </button>
                          
                          <Button
                            color="danger"
                            size="sm"
                            onClick={() => handleDeleteUser(u._id)}
                            disabled={u._id === user.id || u.role === 'admin'}
                          >
                            <Trash2 size={14} />
                            Sil
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800">📨 Kullanıcıya Yeni Mesaj Gönder</h3>
              <button 
                onClick={closeEmailModal}
                className="text-gray-500 hover:text-gray-700 transition"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-700 mb-1">
                  <strong>📧 Alıcı:</strong> {emailModal.username} ({emailModal.email})
                </p>
                <p className="text-xs text-gray-600 mt-2">
                  Bu mesaj doğrudan kullanıcının e-posta adresine gönderilecektir.
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Konu <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Mesajın konusunu yazın..."
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mesaj <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  rows="10"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder="Kullanıcıya göndermek istediğiniz mesajı buraya yazın..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 10 karakter • Bu mesaj kullanıcının e-posta adresine gönderilecektir
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeEmailModal}
                  className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                  disabled={sending}
                >
                  İptal
                </button>
                <button
                  onClick={handleSendEmail}
                  disabled={sending || !emailSubject || emailSubject.trim().length < 3 || !emailMessage || emailMessage.trim().length < 10}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      Gönderiliyor...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Mesajı Gönder
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
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle size={32} className="text-yellow-600" />
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-gray-800 text-center mb-2">
                {confirmModal.title}
              </h3>
              
              {confirmModal.message && (
                <p className="text-gray-600 text-center mb-6">
                  {confirmModal.message}
                </p>
              )}
              
              {confirmModal.needsInput && (
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {confirmModal.inputLabel}
                  </label>
                  <input
                    type="number"
                    value={banDays}
                    onChange={(e) => setBanDays(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  İptal
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
