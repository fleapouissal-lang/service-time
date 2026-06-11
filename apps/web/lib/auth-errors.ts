import type { Messages } from "@/messages/types";

/** Supabase — mot de passe OK mais e-mail non confirmé (confirmation custom). */
export function isEmailNotConfirmedError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("email not confirmed") ||
    normalized.includes("email_not_confirmed")
  );
}

export function mapAuthError(message: string, t: Messages): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("email rate limit")
  ) {
    return t.errors.auth.rateLimit;
  }

  if (normalized.includes("account inactive")) {
    return t.errors.auth.accountInactive;
  }

  if (
    normalized.includes("account profile missing") ||
    normalized.includes("could not load user profile")
  ) {
    return t.errors.auth.profileIncomplete;
  }

  if (normalized.includes("server error during login")) {
    return t.errors.auth.serverConnection;
  }

  if (normalized.includes("invalid login credentials")) {
    return t.errors.auth.invalidCredentials;
  }

  if (normalized.includes("user not found")) {
    return t.errors.auth.userNotFound;
  }

  return message;
}
