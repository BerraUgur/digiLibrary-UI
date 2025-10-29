import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import Button from '../components/UI/Button';

function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Email adresi gereklidir');
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
        toast.success('Şifre sıfırlama linki email adresinize gönderildi!');
      } else {
        toast.error(data.message || 'Bir hata oluştu');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Email Gönderildi!</h2>
          <p className="text-gray-600 mb-6">
            Eğer <strong>{email}</strong> adresi sistemimizde kayıtlıysa, 
            şifre sıfırlama linki gönderildi. Lütfen email kutunuzu kontrol edin.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Email gelmedi mi? Spam klasörünü kontrol edin veya birkaç dakika bekleyin.
          </p>
          <Link to="/login">
            <Button color="primary" className="w-full">
              <ArrowLeft size={18} />
              Giriş Sayfasına Dön
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Şifremi Unuttum</h2>
          <p className="mt-2 text-gray-600">
            Email adresinizi girin, size şifre sıfırlama linki gönderelim.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="ornek@email.com"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            color="primary"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link 
            to="/login" 
            className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
