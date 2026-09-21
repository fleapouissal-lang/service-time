/**
 * Order-received test: CID inline logo (RFC Content-ID with @) + no paperclip filename.
 * Usage: node apps/web/scripts/send-test-email.mjs [to]
 */
import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(__dirname, "..");
const root = path.resolve(webRoot, "../..");
const require = createRequire(path.join(webRoot, "package.json"));
const nodemailer = require("nodemailer");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

loadEnv(path.join(root, ".env"));
loadEnv(path.join(webRoot, ".env.local"));

const host = process.env.SMTP_HOST || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT || 587);
const user = (process.env.SMTP_USER || "").trim();
const pass = (process.env.SMTP_PASS || "").trim().replace(/\s/g, "");
const from =
  (process.env.EMAIL_FROM || "").trim() || `Service Time <${user}>`;
const to = process.argv[2] || "fleapouissal@gmail.com";

if (!user || !pass) {
  console.error("SMTP not configured");
  process.exit(1);
}

// RFC-style CID (must include @) — matches Content-ID: <logo@servicetime.com.sa>
const LOGO_CID = "logo@servicetime.com.sa";
const logoCandidates = [
  path.join(webRoot, "public/logos/email-logo.jpg"),
  path.join(webRoot, "public/logos/email-logo.png"),
  path.join(webRoot, "public/logos/icon.png"),
];
const logoPath = logoCandidates.find((p) => fs.existsSync(p));
if (!logoPath) {
  console.error("No logo file found");
  process.exit(1);
}
const logoBuffer = fs.readFileSync(logoPath);
const isJpeg = logoPath.endsWith(".jpg") || logoPath.endsWith(".jpeg");
const contentType = isJpeg ? "image/jpeg" : "image/png";

const publicSite = "https://servicetime.com.sa";
const year = new Date().getFullYear();
const trackingToken = "ST-" + Date.now().toString().slice(-8);
const trackUrl = `${publicSite}/client/track/${encodeURIComponent(trackingToken)}`;

const sample = {
  customerName: "أحمد العتيبي",
  customerPhone: "+966501234567",
  customerEmail: to,
  serviceTypeLabel: "طوارئ",
  executionMethodLabel: "ورشة متنقلة",
  carType: "تويوتا كامري 2022",
  locationText: "الرياض - حي النرجس، شارع الأمير سلطان",
  description: "السيارة لا تعمل بعد توقف مفاجئ على الطريق.",
  statusLabel: "تم استلام الطلب",
  trackingToken,
  trackUrl,
};

function detailRows(rows) {
  return rows
    .map((row) => {
      const value = escapeHtml(row.value || "—");
      const valueHtml = row.ltr
        ? `<span dir="ltr" style="unicode-bidi:embed;direction:ltr;">${value}</span>`
        : value;
      return `
      <tr>
        <td align="right" dir="rtl" style="padding:12px 0;border-bottom:1px solid #e8eee9;text-align:right;direction:rtl;">
          <div style="font-size:12px;color:#5b6b63;margin:0 0 4px;text-align:right;">${escapeHtml(row.label)}</div>
          <div style="font-size:15px;color:#050B10;font-weight:700;text-align:right;">${valueHtml}</div>
        </td>
      </tr>`;
    })
    .join("");
}

const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>تم استلام طلبك — Service Time</title>
</head>
<body dir="rtl" style="margin:0;padding:0;background:#eef3f0;font-family:Tahoma,Arial,Helvetica,sans-serif;direction:rtl;text-align:right;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef3f0;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #dde6e0;">
        <tr>
          <td align="center" style="padding:28px 24px 16px;background:#ffffff;text-align:center;">
            <img src="cid:${LOGO_CID}" alt="Service Time" width="140" height="117"
              style="display:block;margin:0 auto;width:140px;max-width:140px;height:auto;border:0;outline:none;" />
          </td>
        </tr>
        <tr>
          <td align="right" dir="rtl" style="padding:8px 24px 28px;text-align:right;direction:rtl;">
            <h1 style="margin:0 0 14px;font-size:22px;color:#050B10;font-weight:800;text-align:right;">تم استلام طلبك</h1>
            <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#050B10;text-align:right;">مرحباً ${escapeHtml(sample.customerName)}،</p>
            <p style="margin:0 0 16px;font-size:15px;line-height:1.75;color:#2a3530;text-align:right;">
              تم تسجيل طلب خدمتك بنجاح. احفظ رمز التتبع لمتابعة الحالة والدفع عند جاهزية التسعيرة.
            </p>
            <div style="margin:0 0 18px;text-align:right;">
              <span style="display:inline-block;padding:8px 14px;border-radius:999px;background:#e8f7ef;color:#0f5132;font-size:13px;font-weight:700;">
                ${escapeHtml(sample.statusLabel)}
              </span>
            </div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 20px;width:100%;">
              ${detailRows([
                { label: "نوع الخدمة", value: sample.serviceTypeLabel },
                { label: "طريقة التنفيذ", value: sample.executionMethodLabel },
                { label: "السيارة", value: sample.carType },
                { label: "الموقع", value: sample.locationText },
                { label: "وصف المشكلة", value: sample.description },
                { label: "الجوال", value: sample.customerPhone, ltr: true },
                { label: "البريد", value: sample.customerEmail, ltr: true },
                { label: "رمز التتبع", value: sample.trackingToken, ltr: true },
              ])}
            </table>
            <div style="margin:0 0 20px;padding:16px 18px;border-radius:14px;background:#f3faf6;border:1px solid #cfe9dc;text-align:center;">
              <p style="margin:0 0 8px;font-size:12px;color:#5b6b63;font-weight:600;">رمز التتبع</p>
              <p dir="ltr" style="margin:0;font-size:22px;font-weight:800;letter-spacing:3px;color:#0f5132;font-family:Consolas,'Courier New',monospace;">
                ${escapeHtml(sample.trackingToken)}
              </p>
            </div>
            <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 12px;">
              <tr>
                <td align="center" bgcolor="#0f5132" style="border-radius:14px;background:#0f5132;">
                  <a href="${escapeHtml(sample.trackUrl)}"
                    style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;">
                    تتبع حالة الطلب
                  </a>
                </td>
              </tr>
            </table>
            <p style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#6b7a73;text-align:right;">
              سيصلك إشعار عند تحديث الحالة أو عند جاهزية السعر للموافقة والدفع الإلكتروني.
            </p>
          </td>
        </tr>
        <tr>
          <td align="right" dir="rtl" style="background:#f7fbf8;padding:22px 24px;border-top:1px solid #dde6e0;text-align:right;">
            <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#050B10;">Service Time</p>
            <p style="margin:0;font-size:12px;line-height:1.7;color:#5b6b63;" dir="ltr">
              <a href="${publicSite}" style="color:#0f5132;text-decoration:none;">servicetime.com.sa</a>
              · info@servicetime.com.sa
            </p>
            <p style="margin:10px 0 0;font-size:11px;color:#8a9690;">© ${year} Service Time</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { minVersion: "TLSv1.2" },
});

const info = await transporter.sendMail({
  from,
  to,
  replyTo: user,
  subject: "تم استلام طلبك — Service Time ✓ شعار CID داخل الرسالة",
  // HTML only (no text) → single multipart/related — better Gmail CID linking
  html,
  attachments: [
    {
      // filename:false omits filename from Content-Disposition (less paperclip)
      filename: false,
      content: logoBuffer,
      cid: LOGO_CID,
      contentType,
      contentDisposition: "inline",
    },
  ],
});

console.log(
  JSON.stringify(
    {
      ok: true,
      to,
      subject: "تم استلام طلبك — Service Time ✓ شعار CID داخل الرسالة",
      logo: `${path.basename(logoPath)} (${logoBuffer.length}B) as cid:${LOGO_CID}`,
      trackingToken: sample.trackingToken,
      messageId: info.messageId ?? null,
      accepted: info.accepted,
      response: info.response,
    },
    null,
    2,
  ),
);
