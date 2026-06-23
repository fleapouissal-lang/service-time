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
  text?: string,
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
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
    });
    console.info(`[email] SMTP sent to ${to} messageId=${info.messageId ?? "n/a"}`);
    return { ok: true };
  } catch (error) {
    console.error(`[email] SMTP error to ${to}:`, error);
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
  text?: string,
): Promise<SendEmailResult> {
  ensureServerEnv();

  const { user, pass } = getSmtpConfig();
  if (user && pass) {
    return sendViaSmtp(to, subject, html, text);
  }

  const resendKey = process.env.RESEND_API_KEY?.trim();
  if (resendKey) {
    return sendViaResend(to, subject, html);
  }

  if (process.env.NODE_ENV === "production") {
    console.error("[email] SMTP/Resend not configured in production");
    return {
      ok: false,
      error: "خدمة البريد غير مفعّلة على الخادم. تواصل مع الدعم.",
    };
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
  const text = [
    `مرحباً ${fullName}،`,
    "استخدم الرمز التالي لتفعيل حسابك في Service Time:",
    code,
    "صلاحية الرمز: 10 دقائق.",
  ].join("\n");

  return sendEmail(
    email,
    "رمز تفعيل حسابك — Service Time",
    buildClientVerifyEmailHtml(code, fullName),
    text,
  );
}

function buildContactChangeVerifyEmailHtml(code: string, fullName: string): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.7; color: #050B10;">
      <h2 style="color: #050B10;">Service Time</h2>
      <p>مرحباً ${escapeHtml(fullName)}،</p>
      <p>استخدم الرمز التالي لتأكيد بريدك الإلكتروني الجديد:</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #0f5132;">${code}</p>
      <p style="color: #666;">صلاحية الرمز: 10 دقائق.</p>
    </div>
  `.trim();
}

export async function sendContactChangeVerificationCode(
  email: string,
  code: string,
  fullName: string,
): Promise<SendEmailResult> {
  return sendEmail(
    email,
    "رمز تأكيد البريد — Service Time",
    buildContactChangeVerifyEmailHtml(code, fullName),
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

function buildOrderClientEmailHtml(payload: {
  customerName: string;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel: string;
  whatsappClientUrl: string;
}): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #050B10;">
      <h2 style="color: #050B10;">تم استلام طلبك — Service Time</h2>
      <p>مرحباً ${escapeHtml(payload.customerName)}،</p>
      <p>تم تسجيل طلبك بنجاح. احفظ رمز التتبع للمتابعة:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #0f5132;" dir="ltr">${escapeHtml(payload.trackingToken)}</p>
      <p><strong>نوع الخدمة:</strong> ${escapeHtml(payload.serviceTypeLabel)}</p>
      <p><a href="${escapeHtml(payload.trackUrl)}" dir="ltr">تتبع حالة الطلب</a></p>
      <p style="color: #666;">يمكنك أيضاً متابعة الطلب عبر واتساب:</p>
      <p><a href="${escapeHtml(payload.whatsappClientUrl)}" dir="ltr">فتح واتساب</a></p>
    </div>
  `.trim();
}

function buildOrderAdminEmailHtml(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel: string;
  executionMethodLabel: string;
  carType: string | null;
  locationText: string | null;
  whatsappClientUrl: string;
}): string {
  return `
    <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.8; color: #050B10;">
      <h2 style="color: #050B10;">طلب خدمة جديد — Service Time</h2>
      <p><strong>العميل:</strong> ${escapeHtml(payload.customerName)}</p>
      <p><strong>الجوال:</strong> <span dir="ltr">${escapeHtml(payload.customerPhone)}</span></p>
      <p><strong>البريد:</strong> ${
        payload.customerEmail
          ? `<span dir="ltr">${escapeHtml(payload.customerEmail)}</span>`
          : "—"
      }</p>
      <p><strong>نوع الخدمة:</strong> ${escapeHtml(payload.serviceTypeLabel)}</p>
      <p><strong>طريقة التنفيذ:</strong> ${escapeHtml(payload.executionMethodLabel)}</p>
      <p><strong>السيارة:</strong> ${escapeHtml(payload.carType ?? "—")}</p>
      <p><strong>الموقع:</strong> ${escapeHtml(payload.locationText ?? "—")}</p>
      <p><strong>رمز التتبع:</strong> <span dir="ltr" style="font-size: 20px; letter-spacing: 2px;">${escapeHtml(payload.trackingToken)}</span></p>
      <p><a href="${escapeHtml(payload.trackUrl)}" dir="ltr">صفحة التتبع</a></p>
      <p style="color: #666;">إرسال رمز التتبع للعميل عبر واتساب:</p>
      <p><a href="${escapeHtml(payload.whatsappClientUrl)}" dir="ltr">فتح واتساب مع العميل</a></p>
    </div>
  `.trim();
}

export async function sendOrderCreatedClientEmail(payload: {
  customerName: string;
  customerEmail: string;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel: string;
  whatsappClientUrl: string;
}): Promise<SendEmailResult> {
  return sendEmail(
    payload.customerEmail,
    `رمز تتبع طلبك — Service Time`,
    buildOrderClientEmailHtml(payload),
  );
}

export async function sendOrderCreatedAdminEmail(payload: {
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel: string;
  executionMethodLabel: string;
  carType: string | null;
  locationText: string | null;
  whatsappClientUrl: string;
}): Promise<SendEmailResult> {
  const notifyTo = getContactNotifyEmail();
  if (!notifyTo) {
    console.warn("[order] CONTACT_NOTIFY_EMAIL / SMTP_USER manquant");
    return { ok: true, dev: true };
  }

  return sendEmail(
    notifyTo,
    `طلب جديد — ${payload.customerName} — ${payload.trackingToken}`,
    buildOrderAdminEmailHtml(payload),
  );
}
