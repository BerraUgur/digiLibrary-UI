import apiRequest from "./http";

export const paymentService = {
  createLateFeeCheckout: (loanId) =>
    apiRequest("/payments/create-late-fee-checkout", {
      method: "POST",
      body: { loanId },
    }),
  confirmLateFeePayment: (loanId) =>
    apiRequest("/payments/confirm-late-fee-payment", {
      method: "POST",
      body: { loanId },
    }),
};
