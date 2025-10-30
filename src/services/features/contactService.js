import apiRequest from "./http";

export const contactService = {
  send: (payload) =>
    apiRequest("/contact", {
      method: "POST",
      body: payload,
    }),
};
