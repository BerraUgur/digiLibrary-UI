/**
 * Turkish phone number formatter
 * Formats input to: +90 XXX XXX XX XX
 */

export const formatPhoneNumber = (value) => {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, '');
  
  // If starts with 90, keep it, otherwise add it
  let phoneDigits = digits;
  if (digits.startsWith('90')) {
    phoneDigits = digits.substring(2);
  }
  
  // Limit to 10 digits (Turkish phone number)
  phoneDigits = phoneDigits.substring(0, 10);
  
  // Format: +90 XXX XXX XX XX
  let formatted = '+90';
  
  if (phoneDigits.length > 0) {
    formatted += ` ${phoneDigits.substring(0, 3)}`;
  }
  if (phoneDigits.length > 3) {
    formatted += ` ${phoneDigits.substring(3, 6)}`;
  }
  if (phoneDigits.length > 6) {
    formatted += ` ${phoneDigits.substring(6, 8)}`;
  }
  if (phoneDigits.length > 8) {
    formatted += ` ${phoneDigits.substring(8, 10)}`;
  }
  
  return formatted.trim();
};

export const unformatPhoneNumber = (value) => {
  // Return only the formatted version for validation
  return value;
};
