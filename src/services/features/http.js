const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
    console.error("Token refresh failed:", error);
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
        throw new Error("Session expired. Please login again.");
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP error! status: ${response.status}`);
      error.status = response.status;
      error.details = errorData;
      throw error;
    }

    return await response.json();

  } catch (error) {
    // Re-throw with additional context if it's not already formatted
    if (!error.status) {
      const networkError = new Error("Network error occurred");
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
};

export default apiRequest;
