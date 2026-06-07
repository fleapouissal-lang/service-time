import nodemailer from "nodemailer";
import { ensureServerEnv } from "@/lib/env-server";

export type SendEmailResult =
  | { ok: true; dev?: boolean }
  | { ok: false; error: string };

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim().replace(/\s/g, "") ?? "";
  const from =
    process.env.EMAIL_FROM?.trim() ?? (user ? `Service Time <${user}>` : "");

  return { host, port, user, pass, from };
}

export function getContactNotifyEmail(): string {
  ensureServerEnv();
  return (
    process.env.CONTACT_NOTIFY_EMAIL?.trim() ||
    process.env.SMTP_USER?.trim() ||
    ""
  );
}

async function sendViaSmtp(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const { host, port, user, pass, from } = getSmtpConfig();

  if (!user || !pass) {
    return { ok: false, error: "إعدادات البريد غير مكتملة." };
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
  });

  try {
    await transporter.verify();
    await transporter.sendMail({ from, to, subject, html });
    return { ok: true };
  } catch (error) {
    console.error("[email] SMTP error:", error);
    return { ok: false, error: "تعذّر إرسال البريد. تحقق من إعدادات Gmail." };
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() ?? "Service Time <onboarding@resend.dev>";

  if (!apiKey) {
    return { ok: false, error: "إعدادات البريد غير مكتملة." };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, html }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[email] Resend error:", body);
      return { ok: false, error: "تعذّر إرسال البريد. حاول لاحقاً." };
    }

    return { ok: true };
  } catch (error) {
    console.error("[email] Resend failed:", error);
    return { ok: false, error: "تعذّر إرسال البريد. حاول لاحقاً." };
  }
}

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<SendEmailResult> {
  ensureServerEnv();

  const { user, pass } = getSmtpConfig();
  if (user && pass) {
    return sendViaSmtp(to, subject, html);
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    return sendViaResend(to, subject, html);
  }

  console.info(`[email] Dev mode — would send to ${to}: ${subject}`);
  return { ok: true, dev: true };
}

function buildResetEmailHtml(code: string): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.7; color: #050B10;">
      <h2 style="color: #050B10;">Service Time</h2>
      <p>استخدم الرمز التالي لإعادة تعيين كلمة المرور:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f5132;">${code}</p>
      <p style="color: #666;">صلاحية الرمز: 10 دقائق.</p>
      <p style="color: #666;">إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.</p>
    </div>
  `.trim();
}

export async function sendPasswordResetCode(
  email: string,
  code: string,
): Promise<SendEmailResult> {
  return sendEmail(
    email,
    "رمز إعادة تعيين كلمة المرور — Service Time",
    buildResetEmailHtml(code),
  );
}

function buildClientVerifyEmailHtml(code: string, fullName: string): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.7; color: #050B10;">
      <h2 style="color: #050B10;">Service Time</h2>
      <p>مرحباً ${escapeHtml(fullName)}،</p>
      <p>استخدم الرمز التالي لتفعيل حسابك:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f5132;">${code}</p>
      <p style="color: #666;">صلاحية الرمز: 10 دقائق.</p>
      <p style="color: #666;">يمكنك أيضاً إرسال الرمز عبر واتساب من صفحة التسجيل.</p>
    </div>
  `.trim();
}

export async function sendClientVerificationCode(
  email: string,
  code: string,
  fullName: string,
): Promise<SendEmailResult> {
  return sendEmail(
    email,
    "رمز تفعيل حسابك — Service Time",
    buildClientVerifyEmailHtml(code, fullName),
  );
}

function buildAdminClientRegistrationHtml(payload: {
  fullName: string;
  phone: string;
  email: string;
  code: string;
  whatsappClientUrl: string;
}): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #050B10;">
      <h2 style="color: #050B10;">تسجيل عميل جديد — Service Time</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(payload.fullName)}</p>
      <p><strong>الجوال:</strong> <span dir="ltr">${escapeHtml(payload.phone)}</span></p>
      <p><strong>البريد:</strong> <span dir="ltr">${escapeHtml(payload.email)}</span></p>
      <p><strong>رمز التحقق:</strong> <span style="font-size: 22px; letter-spacing: 4px;">${payload.code}</span></p>
      <p style="color: #666;">إذا لم يستلم العميل البريد، أرسل له الرمز عبر واتساب:</p>
      <p><a href="${escapeHtml(payload.whatsappClientUrl)}" dir="ltr">فتح واتساب وإرسال الرمز للعميل</a></p>
    </div>
  `.trim();
}

/** Notifie l'admin pour qu'il puisse envoyer le code au client par WhatsApp */
export async function sendAdminClientRegistrationNotification(payload: {
  fullName: string;
  phone: string;
  email: string;
  code: string;
  whatsappClientUrl: string;
}): Promise<SendEmailResult> {
  const notifyTo = getContactNotifyEmail();
  if (!notifyTo) {
    return { ok: true, dev: true };
  }

  return sendEmail(
    notifyTo,
    `تسجيل عميل — ${payload.fullName}`,
    buildAdminClientRegistrationHtml(payload),
  );
}

function buildContactEmailHtml(payload: {
  name: string;
  phone: string;
  email: string | null;
  message: string;
}): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #050B10;">
      <h2 style="color: #050B10;">رسالة جديدة — Service Time</h2>
      <p><strong>الاسم:</strong> ${escapeHtml(payload.name)}</p>
      <p><strong>الجوال:</strong> <span dir="ltr">${escapeHtml(payload.phone)}</span></p>
      <p><strong>البريد:</strong> ${
        payload.email
          ? `<span dir="ltr">${escapeHtml(payload.email)}</span>`
          : "—"
      }</p>
      <p><strong>الرسالة:</strong></p>
      <p style="white-space: pre-wrap; background: #f4f4f4; padding: 12px; border-radius: 8px;">${escapeHtml(payload.message)}</p>
    </div>
  `.trim();
}

export async function sendContactNotification(payload: {
  name: string;
  phone: string;
  email: string | null;
  message: string;
}): Promise<SendEmailResult> {
  const notifyTo = getContactNotifyEmail();
  if (!notifyTo) {
    console.warn("[contact] CONTACT_NOTIFY_EMAIL / SMTP_USER manquant");
    return { ok: false, error: "بريد الإشعار غير مُعد." };
  }

  return sendEmail(
    notifyTo,
    `رسالة تواصل جديدة — ${payload.name}`,
    buildContactEmailHtml(payload),
  );
}
