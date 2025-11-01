import * as yup from "yup";

export const registerSchema = (t) => yup.object({
  firstName: yup.string().required(t.auth.validation.firstNameRequired),
  lastName: yup.string().required(t.auth.validation.lastNameRequired),
  email: yup
    .string()
    .email(t.auth.validation.emailInvalid)
    .required(t.auth.validation.emailRequired),
  password: yup
    .string()
    .min(6, t.auth.validation.passwordMinLength)
    .required(t.auth.validation.passwordRequired),
});
