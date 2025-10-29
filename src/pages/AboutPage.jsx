import React, { useState, useEffect } from 'react';
import { BookOpen, Users, Heart, TrendingUp, Award, Clock } from 'lucide-react';
import { bookService } from '../services/api';

const AboutPage = () => {
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalUsers: 0,
    totalLoans: 0,
    loading: true
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await bookService.getLibraryStats();
        setStats({
          totalBooks: data.totalBooks,
          totalUsers: data.totalUsers,
          totalLoans: data.totalLoans,
          loading: false
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        setStats(prev => ({ ...prev, loading: false }));
      }
    };

    fetchStats();
  }, []);

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K+`;
    }
    return `${num}+`;
  };

  return (
    <div className="about-page container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Hakkımızda</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">🏛️ Dijital Kütüphanemiz</h2>
        <p className="mb-4">
          Dijital Kütüphane olarak 2024 yılında yola çıktık. Amacımız, okuma tutkunlarına 
          binlerce kitaba kolay ve hızlı erişim imkanı sunmak. Klasikten çağdaşa, bilimden 
          edebiyata geniş kitap koleksiyonumuzla her yaştan ve her ilgi alanından okuyucuya 
          hitap ediyoruz.
        </p>
        <p className="mb-4">
          Modern kütüphane sistemimiz sayesinde dilediğiniz kitabı saniyeler içinde bulabilir, 
          ödünç alabilir ve okumaya başlayabilirsiniz. Fiziksel kütüphanelerin çekiciliğini 
          dijital dünyanın kolaylığıyla birleştirerek, okuma deneyiminizi en üst seviyeye 
          çıkarmayı hedefliyoruz.
        </p>
        <p>
          Ücretsiz üyelik sistemimizle kitapları ödünç alabilir, favorilerinize ekleyebilir, 
          diğer okuyucuların yorumlarını okuyabilir ve kendi değerlendirmelerinizi paylaşabilirsiniz. 
          Okuma alışkanlığını desteklemek ve kitap kültürünü yaygınlaştırmak için varız.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <BookOpen className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-semibold">Misyonumuz</h2>
          </div>
          <p>
            Herkesin kaliteli kitaplara ulaşabildiği, okuma kültürünün yaygınlaştığı bir 
            toplum oluşturmak. Teknoloji ile okumayı buluşturarak, her yaştan ve her kesimden 
            insanın kitaba erişimini kolaylaştırmak ve okuma alışkanlığını desteklemek.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="text-blue-600 mr-3" size={28} />
            <h2 className="text-xl font-semibold">Vizyonumuz</h2>
          </div>
          <p>
            Türkiye'nin en kapsamlı ve en sevilen dijital kütüphanesi olmak. Sürekli 
            genişleyen kitap koleksiyonumuz ve yenilikçi özelliklerimizle okuyuculara 
            en iyi dijital okuma deneyimini sunmak ve kütüphanecilik anlayışını geleceğe 
            taşımak.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">💎 Değerlerimiz</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-start">
            <Heart className="text-red-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Erişilebilirlik</h3>
              <p className="text-gray-600">Herkesin ücretsiz olarak binlerce kitaba erişebilmesini sağlıyoruz.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Award className="text-yellow-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Kalite</h3>
              <p className="text-gray-600">Seçkin yayınevlerinden özenle seçilmiş kaliteli eserler sunuyoruz.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Users className="text-green-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Topluluk</h3>
              <p className="text-gray-600">Okuyucuların kitaplar hakkında fikirlerini paylaştığı bir topluluk oluşturuyoruz.</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <Clock className="text-purple-500 mr-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h3 className="font-semibold mb-1">Kullanıcı Dostu</h3>
              <p className="text-gray-600">Kolay kullanım, hızlı arama ve pratik ödünç alma sistemi sunuyoruz.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-blue-600 mb-2">
            {stats.loading ? '...' : formatNumber(stats.totalBooks)}
          </div>
          <div className="text-gray-700 font-medium">Kitap Koleksiyonu</div>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-green-600 mb-2">
            {stats.loading ? '...' : formatNumber(stats.totalUsers)}
          </div>
          <div className="text-gray-700 font-medium">Aktif Kullanıcı</div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-md p-6 text-center">
          <div className="text-4xl font-bold text-purple-600 mb-2">7/24</div>
          <div className="text-gray-700 font-medium">Kesintisiz Hizmet</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">📚 Nasıl Çalışır?</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 font-bold text-xl">
              1
            </div>
            <h3 className="font-semibold mb-2">Üye Olun</h3>
            <p className="text-gray-600 text-sm">Ücretsiz hesap oluşturun ve hemen başlayın</p>
          </div>
          
          <div className="text-center">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-green-600 font-bold text-xl">
              2
            </div>
            <h3 className="font-semibold mb-2">Kitap Seçin</h3>
            <p className="text-gray-600 text-sm">Binlerce kitap arasından istediğinizi bulun</p>
          </div>
          
          <div className="text-center">
            <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-purple-600 font-bold text-xl">
              3
            </div>
            <h3 className="font-semibold mb-2">Ödünç Alın</h3>
            <p className="text-gray-600 text-sm">Tek tıkla kitabı ödünç alın</p>
          </div>
          
          <div className="text-center">
            <div className="bg-orange-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 text-orange-600 font-bold text-xl">
              4
            </div>
            <h3 className="font-semibold mb-2">Okuyun ve İade Edin</h3>
            <p className="text-gray-600 text-sm">Okuduktan sonra kolayca iade edin</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;