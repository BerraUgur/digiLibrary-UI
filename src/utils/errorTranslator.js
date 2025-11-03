/**
 * Translates backend error messages to the user's selected language
 * @param {string} errorMessage - The error message from backend
 * @param {string} language - Current language ('tr' or 'en')
 * @returns {string} Translated error message
 */
export const translateError = (errorMessage, language = 'en') => {
  if (!errorMessage || language === 'en') return errorMessage;

  const errorTranslations = {
    // Review errors
    'You have already reviewed this book.': 'Bu kitabı zaten değerlendirdiniz.',
    'Review not found.': 'Değerlendirme bulunamadı.',
    'You do not have permission to delete this review.': 'Bu değerlendirmeyi silme yetkiniz yok.',
    'An error occurred while adding the review.': 'Değerlendirme eklenirken bir hata oluştu.',
    'An error occurred while deleting the review.': 'Değerlendirme silinirken bir hata oluştu.',
    'An error occurred while retrieving the reviews.': 'Değerlendirmeler getirilirken bir hata oluştu.',
    'An error occurred while loading reviews.': 'Değerlendirmeler yüklenirken bir hata oluştu.',

    // Loan errors
    'Admin users are not allowed to borrow books.': 'Admin kullanıcılar kitap ödünç alamaz.',
    'You can only borrow 1 book at a time. Please return your current book before borrowing another.': 'Aynı anda sadece 1 kitap ödünç alabilirsiniz. Başka bir kitap almadan önce mevcut kitabınızı iade edin.',
    'Book is not available.': 'Kitap mevcut değil.',
    'Book not available': 'Kitap mevcut değil',
    'You must specify a due date for returning the book.': 'Kitap iade tarihi belirtmelisiniz.',
    'Due date must be a valid future date.': 'İade tarihi geçerli bir gelecek tarih olmalıdır.',
    'An error occurred while borrowing the book.': 'Kitap ödünç alınırken bir hata oluştu.',
    'An error occurred while listing borrowed books.': 'Ödünç alınan kitaplar listelenirken bir hata oluştu.',
    'Invalid borrowing transaction.': 'Geçersiz ödünç alma işlemi.',
    'Admins are not allowed to return books.': 'Adminler kitap iade edemez.',
    'Book successfully returned on time.': 'Kitap zamanında iade edildi.',
    
    // Book errors
    'Book not found.': 'Kitap bulunamadı.',
    'Only admins can add books.': 'Sadece adminler kitap ekleyebilir.',
    'Only admins can update books.': 'Sadece adminler kitap güncelleyebilir.',
    'Only admins can delete books.': 'Sadece adminler kitap silebilir.',
    'Please fill in all fields: title, author, category.': 'Lütfen tüm alanları doldurun: başlık, yazar, kategori.',
    'Image upload failed.': 'Resim yükleme başarısız.',
    'An error occurred while adding the book.': 'Kitap eklenirken bir hata oluştu.',
    'An error occurred while updating the book.': 'Kitap güncellenirken bir hata oluştu.',
    'An error occurred while retrieving books.': 'Kitaplar getirilirken bir hata oluştu.',
    'Invalid book id.': 'Geçersiz kitap ID.',
    'An error occurred while retrieving the book.': 'Kitap getirilirken bir hata oluştu.',
    'Book successfully deleted.': 'Kitap başarıyla silindi.',
    'Image not found': 'Resim bulunamadı',
    'Error streaming image': 'Resim yüklenirken hata',
    'Failed to load popular books.': 'Popüler kitaplar yüklenemedi.',

    // Auth errors
    'Invalid or expired access token': 'Geçersiz veya süresi dolmuş oturum',
    'Session expired. Please login again.': 'Oturumunuz sona erdi. Lütfen tekrar giriş yapın.',
    'Invalid credentials': 'Geçersiz kimlik bilgileri',
    'User not found': 'Kullanıcı bulunamadı',
    'Email already exists': 'E-posta zaten kayıtlı',
    'Invalid token': 'Geçersiz token',
    'Token expired': 'Token süresi doldu',

    // User errors
    'You do not have permission for this operation.': 'Bu işlem için yetkiniz yok.',
    'User not found.': 'Kullanıcı bulunamadı.',
    'Only admins can access this endpoint.': 'Sadece adminler bu işlemi yapabilir.',

    // Payment errors
    'Payment session creation failed.': 'Ödeme oturumu oluşturulamadı.',
    'Loan not found.': 'Ödünç kaydı bulunamadı.',
    'Late fee has already been paid.': 'Gecikme ücreti zaten ödenmiş.',
    'No late fee to pay.': 'Ödenecek gecikme ücreti yok.',

    // Contact errors
    'Please fill in all fields.': 'Lütfen tüm alanları doldurun.',
    'An error occurred while sending your message.': 'Mesajınız gönderilirken bir hata oluştu.',

    // Favorite errors
    'Book is already in your favorites.': 'Kitap zaten favorilerinizde.',
    'Favorite not found.': 'Favori bulunamadı.',
    'An error occurred while adding to favorites.': 'Favorilere eklenirken bir hata oluştu.',
    'An error occurred while removing from favorites.': 'Favorilerden çıkarılırken bir hata oluştu.',

    // Network errors
    'Network error occurred': 'Ağ hatası oluştu',
    'fetch failed': 'Bağlantı hatası',
  };

  // Check for exact match first
  if (errorTranslations[errorMessage]) {
    return errorTranslations[errorMessage];
  }

  // Check for partial matches (for messages with dynamic content)
  for (const [english, turkish] of Object.entries(errorTranslations)) {
    if (errorMessage.includes(english)) {
      return errorMessage.replace(english, turkish);
    }
  }

  // Handle ban messages with dynamic dates
  if (errorMessage.includes('Your account is banned until')) {
    const match = errorMessage.match(/Your account is banned until (.+?)\. You can borrow books again in (\d+) days?\./);
    if (match) {
      const [, date, days] = match;
      return `Hesabınız ${date} tarihine kadar yasaklandı. ${days} gün sonra tekrar kitap ödünç alabilirsiniz.`;
    }
  }

  // Handle unpaid late fee messages
  if (errorMessage.includes('You have an unpaid late fee of')) {
    const match = errorMessage.match(/You have an unpaid late fee of (.+?) TL/);
    if (match) {
      const [, amount] = match;
      return `${amount} TL ödenmemiş gecikme ücretiniz var. Başka bir kitap almadan önce borcunuzu ödeyin.`;
    }
  }

  // Handle late fee return messages
  if (errorMessage.includes('Book successfully returned. Late fee:')) {
    const match = errorMessage.match(/Book successfully returned\. Late fee: (.+?) TL \((\d+) days? late\)/);
    if (match) {
      const [, fee, days] = match;
      return `Kitap başarıyla iade edildi. Gecikme ücreti: ${fee} TL (${days} gün geç)`;
    }
  }

  // Return original message if no translation found
  return errorMessage;
};

/**
 * Extracts error message from various error formats
 * @param {Error|Object|string} error - The error object
 * @returns {string} Extracted error message
 */
export const getErrorMessage = (error) => {
  if (typeof error === 'string') return error;
  if (error?.message) return error.message;
  if (error?.details?.message) return error.details.message;
  return 'An error occurred';
};
