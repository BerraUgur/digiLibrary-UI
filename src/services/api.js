const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// API istekleri için temel fonksiyonlar
const apiRequest = async (endpoint, options = {}) => {
  // Her istekte en güncel accessToken'ı al
  let token = localStorage.getItem('accessToken');
  // Guard: sometimes localStorage may contain the string 'undefined' or 'null'
  // which is truthy and would produce an invalid header 'Bearer undefined'.
  if (token === 'undefined' || token === 'null') {
    localStorage.removeItem('accessToken');
    token = null;
  }
  const isFormData = options.body instanceof FormData;
  const config = {
    headers: {
      // If body is FormData, don't set Content-Type (browser will set multipart boundary)
      ...(!isFormData ? { 'Content-Type': 'application/json' } : {}),
      // Only include Authorization header when token is a real, non-empty string
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  // Ensure cookies are sent/received (for refresh token cookie paths)
  if (!config.credentials) config.credentials = 'include';

  try {
    // If body is a plain object and not FormData, stringify it for JSON requests
    if (options.body && !(options.body instanceof FormData) && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    }
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Token geçersizse yenilemeyi dene (ama sadece auth gerekli endpointlerde)
    if (response.status === 401 && endpoint !== '/auth/refresh-token' && endpoint !== '/auth/login' && token) {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (refreshToken && refreshToken !== 'undefined' && refreshToken !== 'null') {
        try {
          const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ refreshToken }),
          });
          
          if (refreshResponse.ok) {
            const refreshData = await refreshResponse.json();
            // Refresh sonrası tokenları güncelle
            localStorage.setItem('accessToken', refreshData.accessToken);
            localStorage.setItem('refreshToken', refreshData.refreshToken);
            // Headerı güncelle
            config.headers.Authorization = `Bearer ${refreshData.accessToken}`;
            // Yeni token ile isteği tekrarla
            const retryResponse = await fetch(`${API_URL}${endpoint}`, config);
            if (!retryResponse.ok) {
              const errorData = await retryResponse.json().catch(() => ({}));
              console.error('Retry failed:', errorData);
              throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
            }
            const data = await retryResponse.json();
            return data;
          } else {
            const refreshError = await refreshResponse.json().catch(() => ({}));
            console.error('Refresh failed with status:', refreshResponse.status, refreshError);
            // Sadece 401 veya 403 ise logout yap (diğer hatalar için yapmayalım)
            if (refreshResponse.status === 401 || refreshResponse.status === 403) {
              console.warn('⚠️ Token refresh returned 401/403');
              console.warn('⚠️ TOKEN REFRESH FAILED - DO NOT CLEAR STORAGE YET');
              // NOT: localStorage'ı BURADA temizlemeyin!
              // Bunun yerine sadece hata fırlat, üst katman (component) handle etsin
            }
            throw new Error('Token refresh failed');
          }
        } catch (refreshError) {
          console.error('❌ Token refresh error:', refreshError);
          // NOT: Network hatalarında KESİNLİKLE logout yapma!
          // Component seviyesinde handle edilmeli
          throw refreshError;
        }
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error data:', errorData);
      const err = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      err.status = response.status;
      err.details = errorData;
      throw err;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Auth servisleri
export const authService = {
  register: (userData) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  
  login: (credentials) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  
  logout: () => apiRequest('/auth/logout', {
    method: 'POST',
  }),
  
  refreshToken: () => apiRequest('/auth/refresh-token', {
    method: 'POST',
  }),
};

// Kitap servisleri
export const bookService = {
  getAllBooks: (params = {}) => {
    // Always request stats (reviewCount, avgRating, isFavorite) unless explicitly disabled
    const finalParams = { ...params };
    if (finalParams.stats === undefined) finalParams.stats = '1';
    
    // Kategoriyi normalize et (ilk harf büyük)
    if (finalParams.category && finalParams.category !== '') {
      finalParams.category = finalParams.category.charAt(0).toUpperCase() + finalParams.category.slice(1).toLowerCase();
    }
    
    const queryString = new URLSearchParams(finalParams).toString();
    return apiRequest(`/books${queryString ? `?${queryString}` : ''}`);
  },
  
  getBookById: (id) => apiRequest(`/books/${id}`).catch(err => {
    if (err.status === 400 || err.status === 404) {
      console.warn('[getBookById] book not found or invalid id:', id, err.message);
      return null;
    }
    throw err;
  }),
  
  createBook: (bookData) => apiRequest('/books', {
    method: 'POST',
    body: bookData,
  }),
  
  updateBook: (id, bookData) => apiRequest(`/books/${id}`, {
    method: 'PUT',
    body: bookData,
  }),
  
  deleteBook: (id) => apiRequest(`/books/${id}`, { method: 'DELETE' }),
  
  getPopularBooks: (limit=6, days=30) => apiRequest(`/books/popular?limit=${limit}&days=${days}`),
  
  getLibraryStats: () => apiRequest('/books/stats/library'),
};

// Kullanıcı servisleri
export const userService = {
  getProfile: () => apiRequest('/users/profile'),
  
  updateProfile: (userData) => apiRequest('/users/profile', {
    method: 'PUT',
    body: userData,
  }),
  
  changePassword: (passwordData) => apiRequest('/users/password', {
    method: 'PUT',
    body: passwordData,
  }),

  // Admin: Get all users
  getAllUsers: () => apiRequest('/users'),

  // Admin: Update user (role, ban, etc.)
  updateUser: (userId, userData) => apiRequest(`/users/${userId}`, {
    method: 'PUT',
    body: userData,
  }),

  // Admin: Delete user
  deleteUser: (userId) => apiRequest(`/users/${userId}`, {
    method: 'DELETE',
  }),
};

// Ödünç alma servisleri
export const loanService = {
  getAllLoans: () => apiRequest('/loans'),
  
  getUserLoans: () => apiRequest('/loans/my-loans'),
  
  borrowBook: ({ bookId, dueDate }) => apiRequest('/loans/borrow', {
    method: 'POST',
    body: { bookId, dueDate },
  }),
  
  returnBook: (loanId) => apiRequest(`/loans/return/${loanId}`, {
    method: 'PUT',
  }),
  
  // User late fee history
  getMyLateFees: () => apiRequest('/loans/my-late-fees'),
  
  // Admin endpoints
  getAllLoansAdmin: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/loans/admin/all${queryString ? `?${queryString}` : ''}`);
  },
  
  getLateFeeStats: () => apiRequest('/loans/admin/stats'),
  
  waiveLateFee: (loanId) => apiRequest(`/loans/admin/waive-fee/${loanId}`, {
    method: 'PATCH',
  }),
};

// Değerlendirme servisleri
export const reviewService = {
  // Backend'de /api/reviews route'u ?bookId= query param ile filtreliyor
  getBookReviews: (bookId) => apiRequest(`/reviews?bookId=${bookId}`),
  
  addReview: (bookId, reviewData) => apiRequest('/reviews', {
    method: 'POST',
    body: JSON.stringify({ bookId, ...reviewData }),
  }),
  
  deleteReview: (reviewId) => apiRequest(`/reviews/${reviewId}`, {
    method: 'DELETE',
  }),
  
  getUserReviews: () => apiRequest('/reviews/my-reviews'),
  
  getAllReviews: () => apiRequest('/reviews/all'), // Admin only
};

// Favori servisleri
export const favoriteService = {
  add: (bookId) => apiRequest('/users/favorites', {
    method: 'POST',
    body: { bookId },
  }),
  remove: (favoriteId) => apiRequest(`/users/favorites/${favoriteId}`, { method: 'DELETE' }),
  list: () => apiRequest('/users/favorites'),
};

// İletişim formu servisleri
export const contactService = {
  send: (payload) => apiRequest('/contact', {
    method: 'POST',
    body: payload,
  }),
};

// Admin mesajları
export const messageService = {
  list: (params={}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/contact/messages${qs?`?${qs}`:''}`);
  },
  markRead: (id) => apiRequest(`/contact/messages/${id}/read`, { method: 'PATCH' }),
  reply: (id, replyMessage) => apiRequest(`/contact/messages/${id}/reply`, { 
    method: 'POST',
    body: { replyMessage }
  }),
  sendNewMessage: (email, subject, message) => apiRequest('/contact/send-new-message', {
    method: 'POST',
    body: { email, subject, message }
  }),
  getUnreadCount: () => apiRequest('/contact/unread-count'),
  delete: (id) => apiRequest(`/contact/messages/${id}`, { method: 'DELETE' }),
};

// Ödeme servisleri
export const paymentService = {
  createLateFeeCheckout: (loanId) => apiRequest('/payments/create-late-fee-checkout', {
    method: 'POST',
    body: { loanId },
  }),
  confirmLateFeePayment: (loanId) => apiRequest('/payments/confirm-late-fee-payment', {
    method: 'POST',
    body: { loanId },
  }),
};

export default apiRequest;