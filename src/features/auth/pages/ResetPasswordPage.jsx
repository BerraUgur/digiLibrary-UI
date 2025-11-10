import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import remoteLogger from '../../../utils/remoteLogger';
import { useLanguage } from '../../../context/useLanguage';

const API_URL = import.meta.env.VITE_API_URL;

function ResetPasswordPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error(t.auth.invalidResetLink);
      navigate('/login');
    }
  }, [token, navigate, t.auth.invalidResetLink]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error(t.auth.passwordMinLength);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t.auth.passwordsDoNotMatch);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        toast.success(t.auth.passwordResetSuccess);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        toast.error(data.message || 'Password reset failed');
      }
    } catch (error) {
      remoteLogger.error('Reset password error', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">{t.auth.passwordResetSuccessTitle}</h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            {t.auth.passwordResetSuccessMessage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-blue-600" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t.auth.resetPasswordTitle}</h2>
          <p className="mt-2 text-gray-600 dark:text-slate-300">
            {t.auth.forgotPasswordDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              {t.auth.newPassword}
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              placeholder={t.auth.newPasswordPlaceholder}
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              {t.auth.confirmNewPassword}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              placeholder={t.auth.confirmPasswordPlaceholder}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            color="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? t.auth.resettingPassword : t.auth.resetPasswordButton}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
          >
            {t.auth.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
