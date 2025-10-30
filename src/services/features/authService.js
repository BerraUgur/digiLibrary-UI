import apiRequest from "./http";

export const authService = {
  register: (userData) =>
    apiRequest("/auth/register", {
      method: "POST",
      body: userData,
    }),

  login: (credentials) =>
    apiRequest("/auth/login", {
      method: "POST",
      body: credentials,
    }),

  logout: () =>
    apiRequest("/auth/logout", {
      method: "POST",
    }),

  refreshToken: () =>
    apiRequest("/auth/refresh-token", {
      method: "POST",
    }),
};
