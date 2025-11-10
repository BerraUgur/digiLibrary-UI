import * as yup from "yup";
import { validateTCIdentity } from "../../../utils/tcValidation";

export const registerSchema = (t) => yup.object({
  firstName: yup
    .string()
    .required(t.auth.validation.firstNameRequired)
    .min(2, t.auth.validation.firstNameMinLength)
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, t.auth.validation.firstNameLettersOnly),
  
  lastName: yup
    .string()
    .required(t.auth.validation.lastNameRequired)
    .min(2, t.auth.validation.lastNameMinLength)
    .matches(/^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/, t.auth.validation.lastNameLettersOnly),
  
  email: yup
    .string()
    .email(t.auth.validation.emailInvalid)
    .required(t.auth.validation.emailRequired),
  
  password: yup
    .string()
    .min(6, t.auth.validation.passwordMinLength)
    .required(t.auth.validation.passwordRequired),
  
  tcIdentity: yup
    .string()
    .required(t.auth.validation.tcRequired)
    .matches(/^\d{11}$/, t.auth.validation.tcMustBe11Digits)
    .test('is-valid-tc', t.auth.validation.tcInvalid, (value) => {
      if (!value) return false;
      return validateTCIdentity(value);
    }),
  
  phoneNumber: yup
    .string()
    .required(t.auth.validation.phoneRequired)
    .matches(/^\+90 \d{3} \d{3} \d{2} \d{2}$/, t.auth.validation.phoneInvalid),
  
  address: yup
    .string()
    .required(t.auth.validation.addressRequired)
    .min(10, t.auth.validation.addressMinLength),
  
  birthDate: yup
    .date()
    .required(t.auth.validation.birthDateRequired)
    .test('is-18', t.auth.validation.mustBe18, function(value) {
      if (!value) return false;
      const today = new Date();
      const birthDate = new Date(value);
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= 18;
      }
      return age >= 18;
    })
    .max(new Date(new Date().setFullYear(new Date().getFullYear() - 18)), t.auth.validation.mustBe18),
});
