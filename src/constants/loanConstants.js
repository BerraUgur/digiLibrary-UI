// Centralized loan-related constants
export const LOAN_DURATION_DAYS = 14;           // Default loan duration in days
export const LATE_FEE_PER_DAY = 5;              // Penalty per late day (TL)
export const BAN_MULTIPLIER = 2;                // Ban duration multiplier for late returns
export const MAX_ACTIVE_LOANS = 1;              // Max concurrent loans per user
export const REMINDER_DAY = 13;                 // Day to send reminder (1 day before due)
export const MS_PER_DAY = 24 * 60 * 60 * 1000;  // Milliseconds in one day

export default {
  LOAN_DURATION_DAYS,
  LATE_FEE_PER_DAY,
  BAN_MULTIPLIER,
  MAX_ACTIVE_LOANS,
  REMINDER_DAY,
  MS_PER_DAY,
};
