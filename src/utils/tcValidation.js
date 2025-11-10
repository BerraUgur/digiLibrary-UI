/**
 * Validates Turkish TC Identity Number
 * @param {string} tc - TC Identity Number
 * @returns {boolean} - True if valid
 */
export const validateTCIdentity = (tc) => {
  // TC must be 11 digits
  if (!tc || tc.length !== 11) return false;
  
  // Must be all numbers
  if (!/^\d{11}$/.test(tc)) return false;
  
  // First digit cannot be 0
  if (tc[0] === '0') return false;
  
  // Convert to array of numbers
  const digits = tc.split('').map(Number);
  
  // 10th digit validation
  // Sum of odd positioned digits (1,3,5,7,9) * 7 - Sum of even positioned digits (2,4,6,8)
  // Result mod 10 should equal 10th digit
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];
  const tenthDigit = (oddSum * 7 - evenSum) % 10;
  
  if (tenthDigit !== digits[9]) return false;
  
  // 11th digit validation
  // Sum of first 10 digits mod 10 should equal 11th digit
  const sumFirst10 = digits.slice(0, 10).reduce((a, b) => a + b, 0);
  const eleventhDigit = sumFirst10 % 10;
  
  if (eleventhDigit !== digits[10]) return false;
  
  return true;
};
