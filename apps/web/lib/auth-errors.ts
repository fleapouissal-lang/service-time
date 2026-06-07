export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (
    normalized.includes("rate limit") ||
    normalized.includes("email rate limit")
  ) {
    return "تم تجاوز حد إرسال البريد. انتظر ساعة ثم حاول مجدداً، أو غيّر كلمة المرور من Supabase Dashboard.";
  }

  if (normalized.includes("invalid login credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }

  if (normalized.includes("user not found")) {
    return "لا يوجد حساب مرتبط بهذا البريد الإلكتروني.";
  }

  return message;
}
