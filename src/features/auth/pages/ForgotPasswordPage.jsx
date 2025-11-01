import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../../../components/UI/buttons/Button';
import remoteLogger from '../../../utils/remoteLogger';
import { useLanguage } from '../../../context/useLanguage';

function ForgotPasswordPage() {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error(t.auth.emailRequired);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmailSent(true);
        toast.success(t.auth.resetLinkSent);
      } else {
        toast.error(data.message || 'An error occurred');
      }
    } catch (error) {
      remoteLogger.error('Forgot password error', { error: error?.message || String(error), stack: error?.stack });
      toast.error(t.auth.networkError);
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4">{t.auth.emailSent}</h2>
          <p className="text-gray-600 dark:text-slate-300 mb-6">
            {t.auth.checkEmailMessage}
          </p>
          <Link to="/login">
            <Button color="primary" className="w-full">
              <ArrowLeft size={18} />
              {t.auth.backToLogin}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-slate-100">{t.auth.forgotPasswordTitle}</h2>
          <p className="mt-2 text-gray-600 dark:text-slate-300">
            {t.auth.forgotPasswordDesc}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-slate-200 mb-2">
              {t.auth.email}
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500"
              placeholder={t.auth.emailPlaceholder}
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            color="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? t.auth.sending || 'Sending...' : t.auth.sendResetLinkButton}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            {t.auth.backToLogin}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
