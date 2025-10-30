const API_URL = import.meta.env.VITE_API_URL;

// Main API request function
const apiRequest = async (endpoint, options = {}) => {
  // Always get the latest accessToken
  let token = localStorage.getItem("accessToken");
  // Guard against invalid token values
  if (token === "undefined" || token === "null") {
    localStorage.removeItem("accessToken");
    token = null;
  }
  const isFormData = options.body instanceof FormData;
  const config = {
    headers: {
      // If body is FormData, browser sets Content-Type
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      // Only include Authorization header when token is valid
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  };
  // Ensure cookies are sent/received (for refresh token cookie paths)
  if (!config.credentials) config.credentials = "include";

  // Stringify body if it's a plain object
  if (options.body && !(options.body instanceof FormData) && typeof options.body === "object") {
    config.body = JSON.stringify(options.body);
  }
  const response = await fetch(`${API_URL}${endpoint}`, config);

  // If token is invalid, try to refresh (only for protected endpoints)
  if (
    response.status === 401 &&
    endpoint !== "/auth/refresh-token" &&
    endpoint !== "/auth/login" &&
    token
  ) {
    const refreshToken = localStorage.getItem("refreshToken");
    if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ refreshToken }),
      });
      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json();
        // Update tokens after refresh
        localStorage.setItem("accessToken", refreshData.accessToken);
        localStorage.setItem("refreshToken", refreshData.refreshToken);
        config.headers.Authorization = `Bearer ${refreshData.accessToken}`;
        // Retry original request with new token
        const retryResponse = await fetch(`${API_URL}${endpoint}`, config);
        if (!retryResponse.ok) {
          const errorData = await retryResponse.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${retryResponse.status}`);
        }
        const data = await retryResponse.json();
        return data;
      } else {
        // Only throw error, do not clear storage here
        if (refreshResponse.status === 401 || refreshResponse.status === 403) {
          // Let upper layer handle logout
        }
        throw new Error("Token refresh failed");
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || `HTTP error! status: ${response.status}`);
    err.status = response.status;
    err.details = errorData;
    throw err;
  }

  const data = await response.json();
  return data;
};

export default apiRequest;
