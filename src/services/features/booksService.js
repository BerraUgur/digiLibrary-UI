import apiRequest from "./http";

export const bookService = {
  getAllBooks: (params = {}) => {
    // Always request stats (reviewCount, avgRating, isFavorite) unless explicitly disabled
    const finalParams = { ...params };
    if (finalParams.stats === undefined) finalParams.stats = "1";

    // Normalize category (capitalize first letter)
    if (finalParams.category && finalParams.category !== "") {
      finalParams.category =
        finalParams.category.charAt(0).toUpperCase() +
        finalParams.category.slice(1).toLowerCase();
    }

    const queryString = new URLSearchParams(finalParams).toString();
    return apiRequest(`/books${queryString ? `?${queryString}` : ""}`);
  },

  getBookById: (id) =>
    apiRequest(`/books/${id}`).catch((err) => {
      if (err.status === 400 || err.status === 404) {
        // Return null if book not found or invalid id
        return null;
      }
      throw err;
    }),

  createBook: (bookData) =>
    apiRequest("/books", {
      method: "POST",
      body: bookData,
    }),

  updateBook: (id, bookData) =>
    apiRequest(`/books/${id}`, {
      method: "PUT",
      body: bookData,
    }),

  deleteBook: (id) => apiRequest(`/books/${id}`, { method: "DELETE" }),

  getPopularBooks: (limit = 6, days = 30) =>
    apiRequest(`/books/popular?limit=${limit}&days=${days}`),

  getLibraryStats: () => apiRequest("/books/stats/library"),
};
