import * as yup from "yup";

export const loginSchema = (t) => yup.object({
  email: yup
    .string()
    .email(t.auth.validation.emailInvalid)
    .required(t.auth.validation.emailRequired),
  password: yup
    .string()
    .min(6, t.auth.validation.passwordMinLength)
    .required(t.auth.validation.passwordRequired),
});
