import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { bookService } from '../services/api';
import { BookOpen, Users, Clock, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const [popular, setPopular] = useState([]);
  const [popularLoading, setPopularLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setPopularLoading(true);
        const data = await bookService.getPopularBooks(6, 30);
        if (!ignore) setPopular(Array.isArray(data) ? data : []);
      } catch (e) {
        console.warn('[HomePage] popular fetch error', e);
      } finally {
        if (!ignore) setPopularLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  return (
    <div className="home-page container mx-auto py-6 px-4">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-700 text-white rounded-2xl p-8 mb-10 shadow-lg">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Dijital Kütüphane Deneyimi</h1>
          <p className="text-lg mb-6">
            Binlerce kitaba anında erişim, kolay ödünç alma ve iade sistemi ile modern kütüphane deneyimi.
            Hemen üye olun ve okumaya başlayın!
          </p>
        </div>
      </div>
      
      {/* Özellikler Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <BookOpen className="text-blue-600 mb-3" size={32} />
          <h3 className="font-bold text-lg mb-2">Geniş Kitap Koleksiyonu</h3>
          <p className="text-gray-800">Roman, bilim, tarih, felsefe ve daha fazlası. Binlerce kitap sizleri bekliyor.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <Clock className="text-blue-600 mb-3" size={32} />
          <h3 className="font-bold text-lg mb-2">Kolay Ödünç Alma</h3>
          <p className="text-gray-800">Tek tıkla kitap ödünç alın, 14 gün boyunca keyifle okuyun.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <Shield className="text-blue-600 mb-3" size={32} />
          <h3 className="font-bold text-lg mb-2">Güvenli Sistem</h3>
          <p className="text-gray-800">Kişisel bilgileriniz güvende, ödünç alma geçmişiniz takip edilir.</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center text-center">
          <Users className="text-blue-600 mb-3" size={32} />
          <h3 className="font-bold text-lg mb-2">Topluluk Değerlendirmeleri</h3>
          <p className="text-gray-800">Diğer okuyucuların değerlendirmelerini okuyun, kendi yorumlarınızı paylaşın.</p>
        </div>
      </div>
      
      {/* Öne Çıkan Kitaplar Section */}
      <div className="mb-10">
        <h2 className="text-3xl font-bold mb-6">Öne Çıkan Kitaplar</h2>
        <div className="border-b border-gray-200 mb-6"></div>
        {popularLoading ? (
          <div className="text-center py-10 text-gray-500">Yükleniyor...</div>
        ) : popular.length === 0 ? (
          <div className="text-center py-10 text-gray-500">Popüler kitap bulunamadı.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {popular.map((b) => (
              <div key={b._id} className="bg-white rounded-xl shadow hover:shadow-md transition p-4 flex flex-col">
                <div className="mb-3 cursor-pointer" onClick={() => navigate(`/books/${b._id}`)}>
                  <img
                    src={b.imageUrl || '/book-placeholder.jpg'}
                    alt={b.title}
                    className="h-40 w-full object-cover rounded"
                    onError={(e)=>{ e.target.src='/book-placeholder.jpg'; }}
                  />
                </div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">{b.title}</h3>
                <p className="text-sm text-gray-600 mb-1 line-clamp-1">{b.author}</p>
                <p className="text-xs inline-block bg-gray-100 px-2 py-1 rounded mb-2">{b.category}</p>
                <div className="flex items-center gap-2 text-xs flex-wrap mb-1">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{b.borrowCount} ödünç</span>
                  {typeof b.reviewCount === 'number' && (
                    <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">{b.reviewCount} yorum</span>
                  )}
                  {b.avgRating != null && (
                    <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded flex items-center gap-1">
                      <span className="text-amber-500">★</span>{b.avgRating}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="text-center mt-8">
          <Link to="/books">
            <button className="bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-blue-700 transition">
              Tüm Kitapları Görüntüle
            </button>
          </Link>
        </div>
      </div>
      
      {/* Özellikler Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-2">Neden Biz?</h3>
          <p>
            Modern teknoloji ile geleneksel kütüphane deneyimini birleştiren platformumuz, 
            kullanıcı dostu arayüzü ve geniş koleksiyonu ile okuma keyfini artırıyor.
          </p>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-green-700 text-white rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-bold mb-2">14 Gün Ücretsiz Ödünç Alma</h3>
          <p>Tüm kitaplarımızı 14 gün boyunca ücretsiz ödünç alabilirsiniz.</p>
        </div>
      </div>
      
      {/* Üyelik Çağrısı (sadece misafirler) */}
      {!isAuthenticated && (
        <div className="bg-blue-100 rounded-xl p-8 text-center mb-6">
          <h3 className="text-2xl font-bold mb-3 text-blue-800">Hemen Üye Ol, Okumaya Başla!</h3>
            <p className="mb-6 text-blue-700">Ücretsiz üyelik ile binlerce kitaba erişim ve özel avantajlar için hemen üye olun.</p>
            <div className="flex flex-col md:flex-row justify-center gap-4">
              <Link to="/register">
                <button className="bg-blue-600 text-white font-semibold py-3 px-8 rounded-lg hover:bg-blue-700 transition">
                  Ücretsiz Üye Ol
                </button>
              </Link>
              <Link to="/login">
                <button className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-lg border border-blue-600 hover:bg-blue-50 transition">
                  Giriş Yap
                </button>
              </Link>
            </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
