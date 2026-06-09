import {
  getLoginUrl,
  isSyntheticLoginEmail,
  resolveLoginIdentifier,
} from "@/lib/quick-request-client";
import { sendEmail, type SendEmailResult } from "@/lib/send-email";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";
import { normalizePhone } from "@/lib/whatsapp-utils";

export type AccountWelcomeSource =
  | "admin_created"
  | "client_registered"
  | "quick_request";

export type AccountWelcomePayload = {
  fullName: string;
  loginEmail: string;
  phone: string | null;
  /** Mot de passe en clair — admin / طلب سريع uniquement */
  password?: string;
  source: AccountWelcomeSource;
  loginUrl?: string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function introLine(source: AccountWelcomeSource): string {
  switch (source) {
    case "admin_created":
      return "تم إنشاء حسابك من قبل الإدارة في Service Time. يمكنك تسجيل الدخول باستخدام البيانات التالية:";
    case "client_registered":
      return "تم تفعيل حسابك بنجاح في Service Time. يمكنك تسجيل الدخول باستخدام البيانات التالية:";
    case "quick_request":
      return "تم إنشاء حسابك تلقائياً بعد إرسال طلبك السريع. يمكنك تسجيل الدخول لمتابعة طلباتك:";
  }
}

function passwordLine(payload: AccountWelcomePayload): string {
  if (payload.password) {
    return `كلمة المرور: ${payload.password}`;
  }
  if (payload.source === "client_registered") {
    return "كلمة المرور: التي اخترتها عند التسجيل";
  }
  return "";
}

export function buildAccountWelcomeWhatsAppMessage(
  payload: AccountWelcomePayload,
): string {
  const loginUrl = payload.loginUrl ?? getLoginUrl();
  const phone = payload.phone ? normalizePhone(payload.phone) : null;
  const loginId = resolveLoginIdentifier(payload.loginEmail, payload.phone);
  const lines = [
    `مرحباً ${payload.fullName}،`,
    introLine(payload.source),
    "",
    "بيانات تسجيل الدخول:",
    `البريد أو الجوال: ${loginId}`,
  ];

  if (phone) {
    lines.push(`رقم الجوال: ${phone}`);
  }

  const pwd = passwordLine(payload);
  if (pwd) {
    lines.push(pwd);
  }

  lines.push("", `رابط الدخول: ${loginUrl}`);

  if (payload.password || payload.source === "admin_created") {
    lines.push("ننصحك بتغيير كلمة المرور بعد أول تسجيل دخول.");
  }

  return lines.join("\n");
}

function buildAccountWelcomeEmailHtml(payload: AccountWelcomePayload): string {
  const loginUrl = payload.loginUrl ?? getLoginUrl();
  const phone = payload.phone ? normalizePhone(payload.phone) : null;
  const loginId = resolveLoginIdentifier(payload.loginEmail, payload.phone);
  const passwordHtml = payload.password
    ? `<p><strong>كلمة المرور:</strong> <span dir="ltr" style="font-family: monospace;">${escapeHtml(payload.password)}</span></p>`
    : payload.source === "client_registered"
      ? `<p><strong>كلمة المرور:</strong> التي اخترتها عند التسجيل</p>`
      : "";

  const phoneHtml = phone
    ? `<p><strong>الجوال:</strong> <span dir="ltr">${escapeHtml(phone)}</span></p>`
    : "";

  const loginLabel = isSyntheticLoginEmail(payload.loginEmail)
    ? "تسجيل الدخول بالجوال"
    : "البريد";

  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #050B10;">
      <h2 style="color: #050B10;">مرحباً بك في Service Time</h2>
      <p>مرحباً ${escapeHtml(payload.fullName)}،</p>
      <p>${escapeHtml(introLine(payload.source))}</p>
      <p><strong>${loginLabel}:</strong> <span dir="ltr">${escapeHtml(loginId)}</span></p>
      ${phoneHtml}
      ${passwordHtml}
      <p><a href="${escapeHtml(loginUrl)}" dir="ltr">تسجيل الدخول</a></p>
      ${
        payload.password || payload.source === "admin_created"
          ? `<p style="color: #666;">ننصحك بتغيير كلمة المرور بعد أول تسجيل دخول.</p>`
          : ""
      }
    </div>
  `.trim();
}

export async function sendAccountWelcomeEmail(
  payload: AccountWelcomePayload,
): Promise<SendEmailResult> {
  return sendEmail(
    payload.loginEmail,
    "حسابك في Service Time — بيانات الدخول",
    buildAccountWelcomeEmailHtml(payload),
  );
}

/** Email + WhatsApp automatique après création / activation du compte. */
export async function notifyAccountCreated(
  payload: AccountWelcomePayload,
): Promise<void> {
  const whatsappText = buildAccountWelcomeWhatsAppMessage(payload);

  if (!isSyntheticLoginEmail(payload.loginEmail)) {
    const mail = await sendAccountWelcomeEmail(payload);
    if (!mail.ok) {
      console.error("[account-welcome] email:", mail.error);
    }
  }

  const phone = payload.phone?.trim();
  if (!phone) {
    console.warn("[account-welcome] WhatsApp ignoré — numéro manquant");
    return;
  }

  const wa = await sendWhatsAppMessage(phone, whatsappText);
  if (!wa.ok) {
    console.error("[account-welcome] whatsapp:", wa.error);
  }
}
