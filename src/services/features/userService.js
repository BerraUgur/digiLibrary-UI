import apiRequest from "./http";

export const userService = {
  getProfile: () => apiRequest("/users/profile"),

  updateProfile: (userData) =>
    apiRequest("/users/profile", {
      method: "PUT",
      body: userData,
    }),

  changePassword: (passwordData) =>
    apiRequest("/users/password", {
      method: "PUT",
      body: passwordData,
    }),

  // Admin: Get all users
  getAllUsers: () => apiRequest("/users"),

  // Admin: Update user (role, ban, etc.)
  updateUser: (userId, userData) =>
    apiRequest(`/users/${userId}`, {
      method: "PUT",
      body: userData,
    }),

  // Admin: Delete user
  deleteUser: (userId) =>
    apiRequest(`/users/${userId}`, {
      method: "DELETE",
    }),
};
