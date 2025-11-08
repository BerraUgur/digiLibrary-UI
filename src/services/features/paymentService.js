import apiRequest from "./http";

export const paymentService = {
  createStripeLateFeeCheckout: (loanId) =>
    apiRequest("/payments/create-stripe-late-fee-checkout", {
      method: "POST",
      body: { loanId },
    }),
  confirmStripeLateFeePayment: (loanId) =>
    apiRequest("/payments/confirm-stripe-late-fee-payment", {
      method: "POST",
      body: { loanId },
    }),
  createIyzicoLateFeeCheckout: (loanId) =>
    apiRequest("/payments/create-late-fee-iyzico-checkout", {
      method: "POST",
      body: { loanId },
    }),
};
