import apiRequest from "./http";

export const favoriteService = {
  add: (bookId) =>
    apiRequest("/users/favorites", {
      method: "POST",
      body: { bookId },
    }),
  remove: (favoriteId) =>
    apiRequest(`/users/favorites/${favoriteId}`, { method: "DELETE" }),
  list: () => apiRequest("/users/favorites"),
};
