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

  logout: () => {
    let userPayload = null;
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        userPayload = {
          userId: parsedUser?._id || parsedUser?.id,
          email: parsedUser?.email,
          role: parsedUser?.role,
        };
      }
    } catch (_error) {
      userPayload = null;
    }

    return apiRequest("/auth/logout", {
      method: "POST",
      ...(userPayload && { body: userPayload }),
    });
  },

  refreshToken: () =>
    apiRequest("/auth/refresh-token", {
      method: "POST",
    }),
};
