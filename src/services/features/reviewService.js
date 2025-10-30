import apiRequest from "./http";

export const reviewService = {
  // Get reviews for a book
  getBookReviews: (bookId) => apiRequest(`/reviews?bookId=${bookId}`),

  addReview: (bookId, reviewData) =>
    apiRequest("/reviews", {
      method: "POST",
      body: { bookId, ...reviewData },
    }),

  deleteReview: (reviewId) =>
    apiRequest(`/reviews/${reviewId}`, {
      method: "DELETE",
    }),

  getUserReviews: () => apiRequest("/reviews/my-reviews"),

  getAllReviews: () => apiRequest("/reviews/all"), // Admin only
};
