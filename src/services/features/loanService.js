import apiRequest from "./http";

export const loanService = {
  getAllLoans: () => apiRequest("/loans"),

  getUserLoans: () => apiRequest("/loans/my-loans"),

  borrowBook: ({ bookId, dueDate }) =>
    apiRequest("/loans/borrow", {
      method: "POST",
      body: { bookId, dueDate },
    }),

  returnBook: (loanId) =>
    apiRequest(`/loans/return/${loanId}`, {
      method: "PUT",
    }),

  // User late fee history
  getMyLateFees: () => apiRequest("/loans/my-late-fees"),

  // Admin endpoints
  getAllLoansAdmin: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/loans/admin/all${queryString ? `?${queryString}` : ""}`);
  },

  getLateFeeStats: () => apiRequest("/loans/admin/stats"),

  waiveLateFee: (loanId) =>
    apiRequest(`/loans/admin/waive-fee/${loanId}`, {
      method: "PATCH",
    }),
};
