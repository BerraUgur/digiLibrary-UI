import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { MapPin, Phone, Mail, Clock, Send, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';
import { toast, Zoom } from 'react-toastify';
import { contactService } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Form doğrulama şeması
const contactSchema = yup.object({
  name: yup.string().required('Ad ve soyad zorunludur'),
  email: yup.string().email('Geçerli bir e-posta girin').required('E-posta zorunludur'),
  subject: yup.string().required('Konu zorunludur'),
  message: yup.string().required('Mesaj zorunludur').min(10, 'Mesaj en az 10 karakter olmalıdır')
});

const ContactPage = () => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(contactSchema),
    mode: 'onBlur'
  });

  // Kullanıcı giriş yapmışsa bilgilerini otomatik doldur
  useEffect(() => {
    if (user) {
      setValue('name', user.username || '');
      setValue('email', user.email || '');
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    
    try {
      await contactService.send(data);
      toast.success('Mesajınız başarıyla gönderildi!', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Zoom,
      });
      
      // Giriş yapmış kullanıcı için sadece konu ve mesajı temizle
      if (user) {
        setValue('subject', '');
        setValue('message', '');
      } else {
        // Giriş yapmamış kullanıcı için tüm formu temizle
        reset();
      }
    } catch (error) {
      console.error('Contact form send error:', error);
      toast.error('Mesajınız gönderilirken bir hata oluştu!', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Zoom,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">📞 İletişim</h1>
      
      {/* İletişim Bilgileri ve Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* İletişim Bilgileri */}
        <div>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <h2 className="text-2xl font-semibold mb-4">Bize Ulaşın</h2>
            <p className="text-gray-600 mb-6">
              Kütüphanemiz hakkında sorularınız, kitap önerileriniz veya geri bildirimleriniz için 
              bizimle iletişime geçebilirsiniz. Size en kısa sürede dönüş yapacağız.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <MapPin className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Adres</h3>
                  <p className="text-gray-600">Kütüphane Sokak, No: 23, Kadıköy, İstanbul</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Phone className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Telefon</h3>
                  <p className="text-gray-600">+90 (216) 555 12 34</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Mail className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">E-posta</h3>
                  <p className="text-gray-600">info@dijitalkutuphane.com</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-full mr-4">
                  <Clock className="text-blue-600" size={20} />
                </div>
                <div>
                  <h3 className="font-medium">Hizmet Saatleri</h3>
                  <p className="text-gray-600">7/24 Dijital Erişim</p>
                  <p className="text-gray-600 text-sm mt-1">Destek: Pazartesi - Cuma 09:00 - 18:00</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Sosyal Medya */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">📱 Sosyal Medyada Biz</h2>
            <p className="text-gray-600 text-sm mb-4">
              Yeni kitaplar, okuma önerileri ve etkinliklerimizden haberdar olmak için bizi takip edin!
            </p>
            <div className="flex space-x-4">
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="Facebook">
                <Facebook className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="Twitter">
                <Twitter className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="Instagram">
                <Instagram className="text-blue-600" size={24} />
              </a>
              <a href="#" className="bg-blue-100 hover:bg-blue-200 p-3 rounded-full transition duration-300" title="LinkedIn">
                <Linkedin className="text-blue-600" size={24} />
              </a>
            </div>
          </div>
        </div>
        
        {/* İletişim Formu */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-2">✉️ Mesaj Gönderin</h2>
          
          {/* Admin için uyarı mesajı */}
          {user?.role === 'admin' ? (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
              <div className="flex items-start">
                <div className="text-blue-500 text-3xl mr-4">🔒</div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-800 mb-2">Yönetici Hesabı</h3>
                  <p className="text-blue-700 mb-3">
                    Yöneticiler iletişim formu kullanamaz. Tüm gelen mesajları görüntülemek ve yönetmek için 
                    <strong> Mesajlar</strong> sayfasını kullanabilirsiniz.
                  </p>
                  <a 
                    href="/admin/messages" 
                    className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
                  >
                    <Mail className="mr-2" size={18} />
                    Mesajlara Git
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              <p className="text-gray-600 text-sm mb-6">
                {user 
                  ? '👤 Giriş yapmış kullanıcı olarak mesaj gönderiyorsunuz. Bilgileriniz otomatik dolduruldu.'
                  : 'Formu doldurarak bize ulaşabilirsiniz. Üye olmanız gerekmiyor, herkes mesaj gönderebilir.'}
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Ad Soyad <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Adınız ve soyadınız"
                disabled={!!user}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.name.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📧 E-posta <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register("email")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="ornek@email.com"
                disabled={!!user}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.email.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🏷️ Konu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("subject")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Mesajınızın konusu"
              />
              {errors.subject && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.subject.message}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                💬 Mesaj <span className="text-red-500">*</span>
              </label>
              <textarea
                {...register("message")}
                rows="6"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                placeholder="Mesajınızı buraya yazın..."
              ></textarea>
              {errors.message && (
                <p className="text-red-500 text-sm mt-1 flex items-center">
                  <span className="mr-1">⚠️</span> {errors.message.message}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              className="flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Send className="mr-2" size={18} />
                  Mesaj Gönder
                </>
              )}
            </button>
          </form>
            </>
          )}
        </div>
      </div>
      
      {/* Harita */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4">📍 Konumumuz</h2>
        <div className="rounded-lg overflow-hidden border border-gray-200 h-[400px] bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
          {/* Gerçek uygulamada buraya Google Maps veya başka bir harita servisi entegre edilebilir */}
          <div className="text-center text-gray-500">
            <MapPin size={64} className="mx-auto mb-4 text-blue-500" />
            <p className="text-xl font-semibold text-gray-700 mb-2">Dijital Kütüphane Merkezi</p>
            <p className="text-sm text-gray-600">Kütüphane Sokak, No: 23, Kadıköy, İstanbul</p>
            <p className="text-xs text-gray-500 mt-4">Fiziksel şubemizi ziyaret edebilir veya 7/24 dijital hizmetimizden yararlanabilirsiniz</p>
          </div>
        </div>
      </div>
      
      {/* SSS Bölümü */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-semibold mb-4">❓ Sık Sorulan Sorular</h2>
        <div className="space-y-4">
          
          {/* Kitap Ödünç Alma */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700">📚 Aynı anda kaç kitap ödünç alabilirim?</h3>
            <p className="text-gray-600">
              <strong>Sadece 1 kitap!</strong> Odaklanmanız ve kitapları hızlı rotasyona sokmanız için aynı anda yalnızca 1 kitap ödünç alabilirsiniz. 
              Mevcut kitabınızı iade ettikten sonra yeni kitap alabilirsiniz.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700">⏰ Kitapları ne kadar süre ödünç alabilirim?</h3>
            <p className="text-gray-600">
              Kitapları <strong>14 gün</strong> (2 hafta) süreyle ödünç alabilirsiniz. İade tarihi otomatik olarak belirlenir ve 
              profilinizde görebilirsiniz.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-blue-700">🔔 İade tarihini unutursam hatırlatma gelir mi?</h3>
            <p className="text-gray-600">
              Evet! <strong>13. günde</strong> (iade tarihinden 1 gün önce) size e-posta ile hatırlatma gönderilir. 
            </p>
          </div>

          {/* Ceza Sistemi */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700">💰 Geç iade cezası ne kadar?</h3>
            <p className="text-gray-600">
              Geç kalan her gün için <strong>5 TL</strong> ceza uygulanır. Örneğin:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 ml-4">
              <li>1 gün geç: 5 TL</li>
              <li>2 gün geç: 10 TL</li>
              <li>5 gün geç: 25 TL</li>
            </ul>
            <p className="text-gray-600 mt-2">
              Ceza otomatik olarak hesaplanır ve profilinizden görüntüleyebilirsiniz.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700">🚫 Ban sistemi nasıl çalışır?</h3>
            <p className="text-gray-600">
              Kitabı geç iade ederseniz, <strong>geç kaldığınız gün sayısının 2 katı</strong> kadar ban yersiniz:
            </p>
            <ul className="list-disc list-inside text-gray-600 mt-2 ml-4">
              <li>1 gün geç iade → 2 gün ban</li>
              <li>2 gün geç iade → 4 gün ban</li>
              <li>7 gün geç iade → 14 gün ban</li>
            </ul>
            <p className="text-gray-600 mt-2">
              Ban süresi boyunca yeni kitap ödünç alamazsınız. Ban otomatik olarak başlar ve süre bitince kalkar.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-red-700">⚠️ Geç iade senaryosu örneği?</h3>
            <p className="text-gray-600">
              <strong>Senaryo:</strong> 1 Ocak'ta kitap aldınız, iade tarihi 15 Ocak.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg mt-2 space-y-2 text-sm">
              <p>📅 <strong>14 Ocak (13. gün):</strong> Size hatırlatma maili gelir</p>
              <p>⏰ <strong>15 Ocak:</strong> İade tarihi (son gün)</p>
              <p>🚨 <strong>16 Ocak:</strong> 1 gün geç → 5 TL ceza otomatik hesaplanır</p>
              <p>🚨 <strong>17 Ocak:</strong> 2 gün geç → 10 TL ceza (her gece güncellenir)</p>
              <p>📖 <strong>17 Ocak öğlen:</strong> Kitabı iade ettiniz</p>
              <p>💰 <strong>Sonuç:</strong> 10 TL ceza + 4 gün ban (21 Ocak'a kadar)</p>
            </div>
          </div>

          {/* Ödeme ve İade */}
          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-green-700">💳 Cezaları nasıl ödeyebilirim?</h3>
            <p className="text-gray-600">
              Geç iade cezalarını profilinizdeki <strong>"Geç İade Ücretleri"</strong> sekmesinden kredi kartı ile 
              online ödeyebilirsiniz. Ödeme sonrası ceza kaydınız silinir ve tekrar kitap ödünç alabilirsiniz.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-green-700">🔄 Kitabı nasıl iade ederim?</h3>
            <p className="text-gray-600">
              <strong>"Ödünç Aldığım Kitaplar"</strong> sayfasından kitabınızın yanındaki <strong>"İade Et"</strong> 
              butonuna tıklamanız yeterli. İade işlemi anında tamamlanır ve kitap tekrar müsait hale gelir.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2 text-purple-700">🆓 Kütüphane kullanımı ücretli mi?</h3>
            <p className="text-gray-600">
              <strong>Tamamen ücretsiz!</strong> Üyelik, kitap ödünç alma ve okuma hizmetlerimiz ücretsizdir. 
              Sadece iade tarihini geçirirseniz günlük 5 TL ceza uygulanır.
            </p>
          </div>

          <div className="border-b pb-4">
            <h3 className="font-medium text-lg mb-2">📖 Kitapları fiziksel olarak alıyor muyum?</h3>
            <p className="text-gray-600">
              Hayır, kütüphanemiz tamamen dijitaldir. Kitapları online olarak ödünç alıp dijital ortamda 
              okuyabilirsiniz. Fiziksel teslimat yapılmamaktadır.
            </p>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-2">💡 Kitap önerisi yapabilir miyim?</h3>
            <p className="text-gray-600">
              Tabii ki! İletişim formu üzerinden koleksiyonumuza eklemek istediğiniz kitapları önerebilirsiniz. 
              Tüm önerileri değerlendirip size geri dönüş yapacağız.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;