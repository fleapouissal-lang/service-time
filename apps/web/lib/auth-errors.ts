import type { Messages } from "@/messages/types";

export function mapAuthError(message: string, t: Messages): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("email rate limit")
  ) {
    return t.errors.auth.rateLimit;
  }

  if (normalized.includes("invalid login credentials")) {
    return t.errors.auth.invalidCredentials;
  }

  if (normalized.includes("user not found")) {
    return t.errors.auth.userNotFound;
  }

  return message;
}
