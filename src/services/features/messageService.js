import apiRequest from "./http";

export const messageService = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiRequest(`/contact/messages${qs ? `?${qs}` : ""}`);
  },
  markRead: (id) =>
    apiRequest(`/contact/messages/${id}/read`, { method: "PATCH" }),
  reply: (id, replyMessage) =>
    apiRequest(`/contact/messages/${id}/reply`, {
      method: "POST",
      body: { replyMessage },
    }),
  sendNewMessage: (email, subject, message) =>
    apiRequest("/contact/send-new-message", {
      method: "POST",
      body: { email, subject, message },
    }),
  getUnreadCount: () => apiRequest("/contact/unread-count"),
  delete: (id) =>
    apiRequest(`/contact/messages/${id}`, { method: "DELETE" }),
};
