import nodemailer from "nodemailer";
import {
  EMAIL_LOGO_CID,
  emailToPlainText,
  escapeHtml,
  getEmailLogoAttachment,
  getEmailLogoPublicUrl,
  OFFICIAL_EMAIL_FROM,
  renderServiceTimeEmail,
} from "@/lib/email-template";
import { ensureServerEnv } from "@/lib/env-server";
import { SITE_NAME } from "@/lib/seo";

export type SendEmailResult =
  | { ok: true; dev?: boolean }
  | { ok: false; error: string };

function getSmtpConfig() {
  const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER?.trim() ?? "";
  const pass = process.env.SMTP_PASS?.trim().replace(/\s/g, "") ?? "";
  const from = process.env.EMAIL_FROM?.trim() || OFFICIAL_EMAIL_FROM;

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

  // Prefer CID inline for SMTP so Gmail does not need to fetch the site (CSP blocks proxy).
  // Set EMAIL_LOGO_INLINE=false to force hosted HTTPS instead.
  const useCid = process.env.EMAIL_LOGO_INLINE !== "false";
  const logo = useCid ? getEmailLogoAttachment() : null;
  const publicLogo = getEmailLogoPublicUrl();
  const htmlToSend =
    logo != null
      ? html
      : html.split(`cid:${EMAIL_LOGO_CID}`).join(publicLogo);

  const attachments = logo
    ? [
        {
          filename: logo.filename,
          content: logo.content,
          cid: logo.cid,
          contentType: logo.contentType,
          contentDisposition: logo.contentDisposition,
        },
      ]
    : undefined;

  try {
    const info = await transporter.sendMail({
      from,
      replyTo: from.includes("<")
        ? from.replace(/^.*<([^>]+)>.*$/, "$1")
        : from,
      to,
      subject,
      html: htmlToSend,
      // Prefer HTML-only when embedding CID — cleaner multipart/related for Gmail.
      text: logo ? undefined : (text ?? emailToPlainText(html)),
      attachments,
    });
    console.info(
      `[email] SMTP sent to ${to} messageId=${info.messageId ?? "n/a"}`,
    );
    return { ok: true };
  } catch (error) {
    console.error(`[email] SMTP error to ${to}:`, error);
    return { ok: false, error: "تعذّر إرسال البريد. تحقق من إعدادات الإرسال." };
  }
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text?: string,
): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim() || OFFICIAL_EMAIL_FROM;

  if (!apiKey) {
    return { ok: false, error: "إعدادات البريد غير مكتملة." };
  }

  const htmlToSend = html
    .split(`cid:${EMAIL_LOGO_CID}`)
    .join(getEmailLogoPublicUrl());

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html: htmlToSend,
        text: text ?? emailToPlainText(html),
      }),
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
    return sendViaResend(to, subject, html, text);
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
  return renderServiceTimeEmail({
    title: "إعادة تعيين كلمة المرور",
    intro: "استخدم الرمز التالي لإعادة تعيين كلمة المرور:",
    extraHtml: `
      <div style="margin:8px 0 16px;padding:18px;border-radius:14px;background:#f3faf6;border:1px solid #cfe9dc;text-align:center;">
        <p dir="ltr" style="margin:0;font-size:30px;font-weight:800;letter-spacing:8px;color:#0f5132;font-family:Consolas,'Courier New',monospace;">
          ${escapeHtml(code)}
        </p>
      </div>`,
    note: [
      "صلاحية الرمز: 10 دقائق.",
      "إذا لم تطلب إعادة التعيين، تجاهل هذه الرسالة.",
    ],
  });
}

export async function sendPasswordResetCode(
  email: string,
  code: string,
): Promise<SendEmailResult> {
  return sendEmail(
    email,
    `رمز إعادة تعيين كلمة المرور — ${SITE_NAME}`,
    buildResetEmailHtml(code),
  );
}

function buildClientVerifyEmailHtml(code: string, fullName: string): string {
  return renderServiceTimeEmail({
    title: "تفعيل حسابك",
    greeting: `مرحباً ${fullName}،`,
    intro: "استخدم الرمز التالي لتفعيل حسابك:",
    extraHtml: `
      <div style="margin:8px 0 16px;padding:18px;border-radius:14px;background:#f3faf6;border:1px solid #cfe9dc;text-align:center;">
        <p dir="ltr" style="margin:0;font-size:30px;font-weight:800;letter-spacing:8px;color:#0f5132;font-family:Consolas,'Courier New',monospace;">
          ${escapeHtml(code)}
        </p>
      </div>`,
    note: [
      "صلاحية الرمز: 10 دقائق.",
      "يمكنك أيضاً إرسال الرمز عبر واتساب من صفحة التسجيل.",
    ],
  });
}

export async function sendClientVerificationCode(
  email: string,
  code: string,
  fullName: string,
): Promise<SendEmailResult> {
  const text = [
    `مرحباً ${fullName}،`,
    `استخدم الرمز التالي لتفعيل حسابك في ${SITE_NAME}:`,
    code,
    "صلاحية الرمز: 10 دقائق.",
  ].join("\n");

  return sendEmail(
    email,
    `رمز تفعيل حسابك — ${SITE_NAME}`,
    buildClientVerifyEmailHtml(code, fullName),
    text,
  );
}

function buildContactChangeVerifyEmailHtml(
  code: string,
  fullName: string,
): string {
  return renderServiceTimeEmail({
    title: "تأكيد البريد الإلكتروني",
    greeting: `مرحباً ${fullName}،`,
    intro: "استخدم الرمز التالي لتأكيد بريدك الإلكتروني الجديد:",
    extraHtml: `
      <div style="margin:8px 0 16px;padding:18px;border-radius:14px;background:#f3faf6;border:1px solid #cfe9dc;text-align:center;">
        <p dir="ltr" style="margin:0;font-size:30px;font-weight:800;letter-spacing:8px;color:#0f5132;font-family:Consolas,'Courier New',monospace;">
          ${escapeHtml(code)}
        </p>
      </div>`,
    note: "صلاحية الرمز: 10 دقائق.",
  });
}

export async function sendContactChangeVerificationCode(
  email: string,
  code: string,
  fullName: string,
): Promise<SendEmailResult> {
  return sendEmail(
    email,
    `رمز تأكيد البريد — ${SITE_NAME}`,
    buildContactChangeVerifyEmailHtml(code, fullName),
  );
}

function buildContactEmailHtml(payload: {
  name: string;
  phone: string;
  email: string | null;
  message: string;
}): string {
  return renderServiceTimeEmail({
    title: "رسالة تواصل جديدة",
    intro: "وصلت رسالة جديدة من نموذج التواصل:",
    details: [
      { label: "الاسم", value: payload.name },
      { label: "الجوال", value: payload.phone, ltr: true },
      {
        label: "البريد",
        value: payload.email ?? "—",
        ltr: Boolean(payload.email),
      },
    ],
    extraHtml: `
      <div style="margin:4px 0 12px;padding:14px 16px;border-radius:12px;background:#f4f7f5;border:1px solid #e0e8e3;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#5b6b63;">الرسالة</p>
        <p style="margin:0;white-space:pre-wrap;font-size:14px;line-height:1.75;color:#050B10;">${escapeHtml(payload.message)}</p>
      </div>`,
  });
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
  statusLabel?: string;
}): string {
  return renderServiceTimeEmail({
    title: "تم استلام طلبك",
    greeting: `مرحباً ${payload.customerName}،`,
    intro: "تم تسجيل طلبك بنجاح. احفظ رمز التتبع لمتابعة حالة الطلب.",
    statusLabel: payload.statusLabel ?? "تم استلام الطلب",
    details: [
      { label: "نوع الخدمة", value: payload.serviceTypeLabel },
      { label: "رمز التتبع", value: payload.trackingToken, ltr: true },
    ],
    trackingToken: payload.trackingToken,
    ctaUrl: payload.trackUrl,
    ctaLabel: "تتبع حالة الطلب",
    note: "سيصلك إشعار عند تحديث الحالة أو عند جاهزية السعر للموافقة عند الحاجة.",
  });
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
}): string {
  return renderServiceTimeEmail({
    title: "طلب خدمة جديد",
    intro: "وصل طلب جديد ويحتاج مراجعة العمليات.",
    statusLabel: "طلب جديد",
    details: [
      { label: "العميل", value: payload.customerName },
      { label: "الجوال", value: payload.customerPhone, ltr: true },
      {
        label: "البريد",
        value: payload.customerEmail ?? "—",
        ltr: Boolean(payload.customerEmail),
      },
      { label: "نوع الخدمة", value: payload.serviceTypeLabel },
      { label: "طريقة التنفيذ", value: payload.executionMethodLabel },
      { label: "السيارة", value: payload.carType ?? "—" },
      { label: "الموقع", value: payload.locationText ?? "—" },
      { label: "رمز التتبع", value: payload.trackingToken, ltr: true },
    ],
    trackingToken: payload.trackingToken,
    ctaUrl: payload.trackUrl,
    ctaLabel: "فتح صفحة التتبع",
  });
}

export async function sendOrderCreatedClientEmail(payload: {
  customerName: string;
  customerEmail: string;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel: string;
  whatsappClientUrl?: string;
  statusLabel?: string;
}): Promise<SendEmailResult> {
  return sendEmail(
    payload.customerEmail,
    `تم استلام طلبك — ${SITE_NAME}`,
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
  whatsappClientUrl?: string;
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

function buildQuotePriceClientEmailHtml(payload: {
  customerName: string;
  priceLabel: string;
  trackingToken: string;
  trackUrl: string;
  statusLabel?: string;
}): string {
  return renderServiceTimeEmail({
    title: "السعر جاهز للموافقة",
    greeting: `مرحباً ${payload.customerName}،`,
    intro:
      "حددت إدارة العمليات سعراً لطلبك. يرجى مراجعة السعر والموافقة ثم إكمال الدفع من صفحة التتبع.",
    statusLabel: payload.statusLabel ?? "بانتظار موافقتك",
    details: [
      { label: "السعر", value: payload.priceLabel, ltr: true },
      { label: "رمز التتبع", value: payload.trackingToken, ltr: true },
    ],
    trackingToken: payload.trackingToken,
    ctaUrl: payload.trackUrl,
    ctaLabel: "الموافقة على السعر",
  });
}

export async function sendQuotePriceClientEmail(payload: {
  customerName: string;
  customerEmail: string;
  priceLabel: string;
  trackingToken: string;
  trackUrl: string;
  statusLabel?: string;
}): Promise<SendEmailResult> {
  return sendEmail(
    payload.customerEmail,
    `سعر طلبك جاهز للموافقة — ${SITE_NAME}`,
    buildQuotePriceClientEmailHtml(payload),
  );
}

function buildOrderStatusClientEmailHtml(payload: {
  customerName: string;
  statusLabel: string;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel?: string;
}): string {
  return renderServiceTimeEmail({
    title: "تحديث حالة الطلب",
    greeting: `مرحباً ${payload.customerName}،`,
    intro: "تم تحديث حالة طلبك. يمكنك متابعة التفاصيل من صفحة التتبع.",
    statusLabel: payload.statusLabel,
    details: [
      ...(payload.serviceTypeLabel
        ? [{ label: "نوع الخدمة", value: payload.serviceTypeLabel }]
        : []),
      { label: "الحالة الجديدة", value: payload.statusLabel },
      { label: "رمز التتبع", value: payload.trackingToken, ltr: true },
    ],
    trackingToken: payload.trackingToken,
    ctaUrl: payload.trackUrl,
    ctaLabel: "تتبع الطلب",
  });
}

export async function sendOrderStatusClientEmail(payload: {
  customerName: string;
  customerEmail: string;
  statusLabel: string;
  trackingToken: string;
  trackUrl: string;
  serviceTypeLabel?: string;
}): Promise<SendEmailResult> {
  return sendEmail(
    payload.customerEmail,
    `تحديث حالة طلبك — ${SITE_NAME}`,
    buildOrderStatusClientEmailHtml(payload),
  );
}

function buildQuoteAcceptedClientEmailHtml(payload: {
  customerName: string;
  priceLabel?: string;
  trackingToken: string;
  trackUrl: string;
}): string {
  return renderServiceTimeEmail({
    title: "تم اعتماد التسعيرة",
    greeting: `مرحباً ${payload.customerName}،`,
    intro:
      "تم اعتماد السعر لطلبك بنجاح. أكمل الدفع إن لزم لمتابعة تعيين الفني وتنفيذ الخدمة.",
    statusLabel: "تم اعتماد السعر",
    details: [
      ...(payload.priceLabel
        ? [{ label: "السعر المعتمد", value: payload.priceLabel, ltr: true }]
        : []),
      { label: "رمز التتبع", value: payload.trackingToken, ltr: true },
    ],
    trackingToken: payload.trackingToken,
    ctaUrl: payload.trackUrl,
    ctaLabel: "متابعة الطلب",
  });
}

function buildQuoteAcceptedAdminEmailHtml(payload: {
  customerName: string;
  priceLabel?: string;
  trackingToken: string;
  trackUrl: string;
}): string {
  return renderServiceTimeEmail({
    title: "اعتماد تسعيرة من العميل",
    intro: "اعتمد العميل التسعيرة ويمكن متابعة الدفع والتعيين.",
    statusLabel: "سعر معتمد",
    details: [
      { label: "العميل", value: payload.customerName },
      ...(payload.priceLabel
        ? [{ label: "السعر المعتمد", value: payload.priceLabel, ltr: true }]
        : []),
      { label: "رمز التتبع", value: payload.trackingToken, ltr: true },
    ],
    trackingToken: payload.trackingToken,
    ctaUrl: payload.trackUrl,
    ctaLabel: "فتح صفحة التتبع",
  });
}

export async function sendQuoteAcceptedClientEmail(payload: {
  customerName: string;
  customerEmail: string;
  priceLabel?: string;
  trackingToken: string;
  trackUrl: string;
}): Promise<SendEmailResult> {
  return sendEmail(
    payload.customerEmail,
    `تم اعتماد تسعيرة طلبك — ${SITE_NAME}`,
    buildQuoteAcceptedClientEmailHtml(payload),
  );
}

export async function sendQuoteAcceptedAdminEmail(payload: {
  customerName: string;
  priceLabel?: string;
  trackingToken: string;
  trackUrl: string;
}): Promise<SendEmailResult> {
  const notifyTo = getContactNotifyEmail();
  if (!notifyTo) {
    return { ok: true, dev: true };
  }

  return sendEmail(
    notifyTo,
    `اعتماد تسعيرة — ${payload.customerName} — ${payload.trackingToken}`,
    buildQuoteAcceptedAdminEmailHtml(payload),
  );
}

function buildLoginOtpEmailHtml(code: string): string {
  return renderServiceTimeEmail({
    title: "رمز التحقق لتسجيل الدخول",
    intro:
      "تم التحقق من البريد وكلمة المرور. أدخل الرمز التالي لإكمال تسجيل دخول الإدارة:",
    extraHtml: `
      <div style="margin:8px 0 16px;padding:18px;border-radius:14px;background:#f3faf6;border:1px solid #cfe9dc;text-align:center;">
        <p dir="ltr" style="margin:0;font-size:30px;font-weight:800;letter-spacing:8px;color:#0f5132;font-family:Consolas,'Courier New',monospace;">
          ${escapeHtml(code)}
        </p>
      </div>`,
    note: [
      "صلاحية الرمز: 10 دقائق.",
      "إذا لم تحاول تسجيل الدخول، تجاهل هذه الرسالة فوراً.",
    ],
  });
}

export async function sendLoginOtpCode(
  email: string,
  code: string,
): Promise<SendEmailResult> {
  return sendEmail(
    email,
    `رمز تسجيل الدخول — ${SITE_NAME}`,
    buildLoginOtpEmailHtml(code),
  );
}
