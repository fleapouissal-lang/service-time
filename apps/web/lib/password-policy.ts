export const PASSWORD_MIN_LENGTH = 8;

/** HTML5 — au moins 8 caractères avec lettres et chiffres. */
export const PASSWORD_HTML_PATTERN = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$";

export const PASSWORD_REQUIREMENTS_AR =
  "كلمة المرور يجب أن تكون 8 أحرف على الأقل وتحتوي على حروف (a-z) وأرقام.";

export const PASSWORD_REQUIREMENTS_EN =
  "Password must be at least 8 characters and include letters and numbers.";

export function isStrongEnoughPassword(password: string): boolean {
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  return /[A-Za-z]/.test(password) && /\d/.test(password);
}
