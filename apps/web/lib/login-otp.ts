import {
  generateResetCode,
  hashResetCode,
  isValidResetCodeFormat,
  matchesResetCodeHash,
  normalizeEmail,
  RESET_CODE_MAX_ATTEMPTS,
  RESET_CODE_TTL_MS,
  RESET_REQUESTS_PER_HOUR,
} from "@/lib/password-reset";

export const LOGIN_OTP_TTL_MS = RESET_CODE_TTL_MS;
export const LOGIN_OTP_MAX_ATTEMPTS = RESET_CODE_MAX_ATTEMPTS;
export const LOGIN_OTP_REQUESTS_PER_HOUR = RESET_REQUESTS_PER_HOUR;

export {
  generateResetCode as generateLoginOtpCode,
  hashResetCode as hashLoginOtpCode,
  isValidResetCodeFormat as isValidLoginOtpFormat,
  matchesResetCodeHash as matchesLoginOtpHash,
  normalizeEmail,
};
