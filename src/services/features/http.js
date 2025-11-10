import { translateError, getErrorMessage } from '../../utils/errorTranslator';

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Validates and retrieves token from localStorage
 * @param {string} key - Token key in localStorage
 * @returns {string|null} Valid token or null
 */
const getValidToken = (key) => {
  const token = localStorage.getItem(key);
  if (!token || token === "undefined" || token === "null") {
    localStorage.removeItem(key);
    return null;
  }
  return token;
};

/**
 * Refreshes the access token using the refresh token
 * @returns {Promise<string|null>} New access token or null
 */
const refreshAccessToken = async () => {
  const refreshToken = getValidToken("refreshToken");
  if (!refreshToken) return null;

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      return data.accessToken;
    }
  } catch (error) {
    // Token refresh failed - log to remote system
    import('../../utils/remoteLogger').then(({ default: remoteLogger }) => {
      remoteLogger.error('Token refresh failed', { error: error.message });
    });
  }

  return null;
};

/**
 * Main API request handler with automatic token refresh
 * @param {string} endpoint - API endpoint (e.g., '/users/profile')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
const apiRequest = async (endpoint, options = {}) => {
  const token = getValidToken("accessToken");
  const isFormData = options.body instanceof FormData;

  const buildConfig = (authToken) => ({
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
      ...options.headers,
    },
    credentials: options.credentials || "include",
    body: isFormData || !options.body
      ? options.body
      : JSON.stringify(options.body),
  });

  try {
    let response = await fetch(`${API_URL}${endpoint}`, buildConfig(token));

    // Handle 401 with token refresh (exclude auth endpoints)
    const shouldRefresh =
      response.status === 401 &&
      !endpoint.includes("/auth/refresh-token") &&
      !endpoint.includes("/auth/login") &&
      token;

    if (shouldRefresh) {
      const newToken = await refreshAccessToken();

      if (newToken) {
        // Retry with new token
        response = await fetch(`${API_URL}${endpoint}`, buildConfig(newToken));
      } else {
        // Clear all auth data and redirect to home
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        
        // Redirect to home page
        if (typeof window !== 'undefined') {
          window.location.href = '/';
        }
        
        throw new Error("Session expired. Please login again.");
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const originalMessage = errorData.message || `HTTP error! status: ${response.status}`;
      
      // Get current language from localStorage
      const currentLanguage = localStorage.getItem('language') || 'en';
      
      // Translate error message if needed
      const translatedMessage = translateError(originalMessage, currentLanguage);
      
      const error = new Error(translatedMessage);
      error.status = response.status;
      error.details = errorData;
      error.originalMessage = originalMessage;
      
      // Log 403 errors for debugging (but don't alert user for these)
      if (response.status === 403) {
        import('../../utils/remoteLogger').then(({ default: remoteLogger }) => {
          remoteLogger.warn('403 Forbidden', {
            endpoint,
            status: response.status,
            message: originalMessage
          });
        });
      }
      
      throw error;
    }

    return await response.json();

  } catch (error) {
    // Re-throw with additional context if it's not already formatted
    if (!error.status) {
      // Get current language from localStorage
      const currentLanguage = localStorage.getItem('language') || 'en';
      const errorMsg = getErrorMessage(error);
      const translatedMsg = translateError(errorMsg, currentLanguage);
      
      const networkError = new Error(translatedMsg);
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
};

export default apiRequest;
