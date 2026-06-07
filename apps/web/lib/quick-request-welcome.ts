import {
  buildWaMeUrl,
  normalizePhone,
  phoneToWhatsAppDigits,
} from "@/lib/whatsapp-utils";

export function buildQuickRequestWelcomeWhatsAppMessage(payload: {
  fullName: string;
  loginEmail: string;
  password: string;
  loginUrl: string;
}): string {
  return [
    `مرحباً ${payload.fullName}،`,
    "تم إنشاء حسابك في Service Time بعد طلبك السريع.",
    "",
    "بيانات تسجيل الدخول:",
    `البريد أو الجوال: ${payload.loginEmail}`,
    `كلمة المرور: ${payload.password}`,
    "",
    `رابط الدخول: ${payload.loginUrl}`,
    "يمكنك تغيير كلمة المرور بعد تسجيل الدخول.",
  ].join("\n");
}

export function buildQuickRequestWelcomeWhatsAppUrl(payload: {
  clientPhone: string;
  fullName: string;
  loginEmail: string;
  password: string;
  loginUrl: string;
}): string {
  return buildWaMeUrl(
    phoneToWhatsAppDigits(payload.clientPhone),
    buildQuickRequestWelcomeWhatsAppMessage(payload),
  );
}

export function formatPhoneForDisplay(phone: string): string {
  return normalizePhone(phone);
}
