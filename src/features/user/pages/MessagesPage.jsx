import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/context/useAuth';
import { useNavigate } from 'react-router-dom';
import { messageService } from '../../../services';
import { ROLES } from '../../../constants/rolesConstants';
import { toast } from 'react-toastify';
import { Send, X } from 'lucide-react';
import { useLanguage } from '../../../context/useLanguage';
import remoteLogger from '../../../utils/remoteLogger';

const statusBadges = {
  new: 'bg-blue-100 text-blue-700',
  read: 'bg-green-100 text-green-700'
};

export default function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [messages, setMessages] = useState([]);
  const [loadingData, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [replyModal, setReplyModal] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [newMessageModal, setNewMessageModal] = useState(null);
  const [newMessageSubject, setNewMessageSubject] = useState('');
  const [newMessageText, setNewMessageText] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await messageService.list({ page, status: statusFilter || undefined });
      setMessages(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      remoteLogger.error('Message list error', { error: err?.message || String(err), stack: err?.stack });
      toast.error(t.messages.failedToFetch);
    } finally { setLoading(false); }
  }, [page, statusFilter, t.messages.failedToFetch]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const markRead = async (id) => {
    try {
      await messageService.markRead(id);
      fetchData();
      toast.success(t.messages.markedAsRead);
      // Trigger event to update header badge
      window.dispatchEvent(new Event('messagesUpdated'));
    } catch { toast.error(t.messages.failedToMarkRead); }
  };

  const openReplyModal = (message) => {
    setReplyModal(message);
    setReplyText(message.reply?.message || '');
  };

  const closeReplyModal = () => {
    setReplyModal(null);
    setReplyText('');
  };

  const sendReply = async () => {
    if (!replyText || replyText.trim().length < 10) {
      toast.error(t.messages.replyTooShort);
      return;
    }

    setSending(true);
    try {
      await messageService.reply(replyModal._id, replyText);
      toast.success(t.messages.replySent);
      closeReplyModal();
      fetchData();
      // Trigger event to update header badge
      window.dispatchEvent(new Event('messagesUpdated'));
    } catch (err) {
      remoteLogger.error('Reply error', { error: err?.message || String(err), stack: err?.stack });
      toast.error(t.messages.failedToSendReply);
    } finally {
      setSending(false);
    }
  };

  const openNewMessageModal = (message) => {
    setNewMessageModal(message);
    setNewMessageSubject('');
    setNewMessageText('');
  };

  const closeNewMessageModal = () => {
    setNewMessageModal(null);
    setNewMessageSubject('');
    setNewMessageText('');
  };

  const sendNewMessage = async () => {
    if (!newMessageSubject || newMessageSubject.trim().length < 3) {
      toast.error(t.messages.subjectTooShort);
      return;
    }
    if (!newMessageText || newMessageText.trim().length < 10) {
      toast.error(t.messages.messageTooShort);
      return;
    }

    setSending(true);
    try {
      await messageService.sendNewMessage(newMessageModal.email, newMessageSubject, newMessageText);
      toast.success(t.messages.newMessageSent);
      closeNewMessageModal();
      fetchData(); // Refresh conversation to show new message
    } catch (err) {
      remoteLogger.error('Send new message error', { error: err?.message || String(err), stack: err?.stack });
      toast.error(t.messages.failedToSendMessage);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    fetchData();
  }, [fetchData, user, loading, navigate]);

  if (!user || user.role !== ROLES.ADMIN) {
    return <div className="p-6">{t.messages.noPermission}</div>;
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-3xl font-bold mb-6">📨 {t.messages.contactMessages}</h1>

      <div className="flex items-center gap-4 mb-6">
        <select
          value={statusFilter}
          onChange={e => { setPage(1); setStatusFilter(e.target.value); }}
          className="border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          <option value="">{t.messages.all}</option>
          <option value="new">{t.messages.new}</option>
          <option value="read">{t.messages.read}</option>
        </select>
        <span className="text-sm text-gray-600 dark:text-slate-300 font-medium">{t.general.total}: {total} {t.messages.totalMessages}</span>
      </div>

      {loadingData ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {messages.map(conversation => (
            <div key={conversation.email} className="border border-gray-200 dark:border-slate-700 rounded-xl p-6 shadow-sm bg-white dark:bg-slate-800 hover:shadow-md transition">
              {/* Conversation Header */}
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-slate-700">
                <div className="flex-1">
                  <h2 className="font-bold text-xl text-gray-800 dark:text-slate-100 mb-1">
                    💬 {conversation.name}
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-slate-300">
                    <a href={`mailto:${conversation.email}`} className="text-blue-600 hover:underline">
                      {conversation.email}
                    </a>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                    {conversation.messages.length} {t.messages.messages}
                    {conversation.hasUnread && (
                      <span className="ml-2 px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        {t.messages.newMessage}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="space-y-3 mb-4">
                {conversation.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)).map((msg, index) => (
                  <div key={msg._id}>
                    {/* User Message */}
                    <div className="bg-gray-50 dark:bg-slate-700 border-l-4 border-gray-400 dark:border-slate-600 p-4 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-700 dark:text-slate-200">
                            {index === 0 ? `📝 ${t.messages.firstMessage}` : `📝 ${t.messages.message} #${index + 1}`}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusBadges[msg.status]}`}>
                            {msg.status === 'new' ? t.messages.new : t.messages.read}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 dark:text-slate-200 mb-1">
                        {t.messages.subject}: {msg.subject}
                      </p>
                      <p className="whitespace-pre-wrap text-gray-800 dark:text-slate-100 text-sm leading-relaxed">
                        {msg.message}
                      </p>

                      {/* Reply to this specific message */}
                      {msg.reply?.message && (
                        <div className="mt-3 bg-blue-50 dark:bg-slate-700 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Send size={14} className="text-blue-600" />
                            <span className="text-xs font-semibold text-blue-800 dark:text-blue-300">{t.messages.adminReply}</span>
                            <span className="text-xs text-gray-500 dark:text-slate-400">
                              ({new Date(msg.reply.repliedAt).toLocaleString('tr-TR')})
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap text-gray-800 dark:text-slate-100 text-xs leading-relaxed">
                            {msg.reply.message}
                          </p>
                        </div>
                      )}

                      {/* Reply button for unresponded messages */}
                      {!msg.reply?.message && (
                        <div className="mt-3 flex gap-2">
                          {msg.status === 'new' && (
                            <button
                              onClick={() => markRead(msg._id)}
                              className="px-3 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition font-medium"
                            >
                              {t.messages.markAsRead}
                            </button>
                          )}
                          <button
                            onClick={() => openReplyModal(msg)}
                            className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition font-medium flex items-center gap-1"
                          >
                            <Send size={12} />
                            {t.messages.sendReply}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Conversation Actions */}
              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-slate-700">
                <button
                  onClick={() => openNewMessageModal(conversation)}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition font-medium flex items-center gap-2"
                >
                  <Send size={16} />
                  {t.messages.sendNewMessage}
                </button>
              </div>
            </div>
          ))}
          {messages.length === 0 && (
            <div className="text-center py-12 text-gray-500 dark:text-slate-400">
              <p className="text-lg">{t.messages.noMessages}</p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3 mt-6 justify-center">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
          className="px-5 py-2 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium dark:text-slate-200"
        >
          {t.messages.previous}
        </button>
        <span className="px-5 py-2 bg-gray-100 dark:bg-slate-700 rounded-lg font-medium dark:text-slate-200">
          {t.messages.page} {page}
        </span>
        <button
          disabled={(page * 20) >= total}
          onClick={() => setPage(p => p + 1)}
          className="px-5 py-2 border border-gray-300 dark:border-slate-600 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium dark:text-slate-200"
        >
          {t.messages.next}
        </button>
      </div>

      {/* Reply Modal */}
      {replyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t.messages.replyToMessage}</h3>
              <button
                onClick={closeReplyModal}
                className="text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-gray-50 dark:bg-slate-700 p-4 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-1">
                  <strong>{t.messages.subject}:</strong> {replyModal.subject}
                </p>
                <p className="text-sm text-gray-600 dark:text-slate-300 mb-2">
                  <strong>{t.messages.from}:</strong> {replyModal.name} ({replyModal.email})
                </p>
                <div className="border-t pt-2 mt-2">
                  <p className="text-sm text-gray-700 dark:text-slate-200 whitespace-pre-wrap">{replyModal.message}</p>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  {t.messages.yourReply} <span className="text-red-500">{t.messages.required}</span>
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows="8"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder={t.messages.replyPlaceholder}
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {t.messages.minimumChars} • {t.messages.replyWillBeEmailed}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeReplyModal}
                  className="px-5 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium"
                  disabled={sending}
                >
                  {t.messages.cancel}
                </button>
                <button
                  onClick={sendReply}
                  disabled={sending || !replyText || replyText.trim().length < 10}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t.messages.sending}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t.messages.sendReply}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Message Modal */}
      {newMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t.messages.sendNewMessageToUser}</h3>
              <button
                onClick={closeNewMessageModal}
                className="text-gray-500 dark:text-slate-300 hover:text-gray-700 dark:hover:text-slate-200 transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
                <p className="text-sm text-gray-700 dark:text-slate-200 mb-1">
                  <strong>{t.messages.recipient}</strong> {newMessageModal.name} ({newMessageModal.email})
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400 mt-2">
                  {t.messages.messageWillBeSent}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  {t.messages.subject} <span className="text-red-500">{t.messages.required}</span>
                </label>
                <input
                  type="text"
                  value={newMessageSubject}
                  onChange={(e) => setNewMessageSubject(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={t.messages.enterSubject}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-2">
                  {t.messages.message} <span className="text-red-500">{t.messages.required}</span>
                </label>
                <textarea
                  value={newMessageText}
                  onChange={(e) => setNewMessageText(e.target.value)}
                  rows="10"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                  placeholder={t.messages.enterMessage}
                />
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
                  {t.messages.minimumChars} • {t.messages.messageWillBeEmailed}
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeNewMessageModal}
                  className="px-5 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition font-medium"
                  disabled={sending}
                >
                  {t.messages.cancel}
                </button>
                <button
                  onClick={sendNewMessage}
                  disabled={sending || !newMessageSubject || newMessageSubject.trim().length < 3 || !newMessageText || newMessageText.trim().length < 10}
                  className="px-5 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {t.messages.sending}
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      {t.messages.sendMessage}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}