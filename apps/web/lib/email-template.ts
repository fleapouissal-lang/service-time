import fs from "fs";
import path from "path";
import { ensureServerEnv } from "@/lib/env-server";
import { absoluteUrl, SITE_EMAIL, SITE_NAME, SITE_PHONE } from "@/lib/seo";

export const OFFICIAL_EMAIL_FROM = `${SITE_NAME} <${SITE_EMAIL}>`;
/** CID for rare SMTP inline mode — Gmail web often shows CID as a paperclip. */
export const EMAIL_LOGO_CID = "logo@servicetime.com.sa";

/** Production logo that is actually deployable (logo-ar / email-logo may 404). */
export const EMAIL_LOGO_PUBLIC_PATH = "/logos/logo-en.png";

export type EmailDetailRow = {
  label: string;
  value: string;
  /** Keep LTR for phones, tokens, emails, prices */
  ltr?: boolean;
};

export type ServiceTimeEmailOptions = {
  /** Notification title shown under the logo */
  title: string;
  /** Optional greeting line, e.g. مرحباً أحمد، */
  greeting?: string;
  /** Intro paragraphs (plain text, escaped) */
  intro?: string | string[];
  /** Status badge text */
  statusLabel?: string;
  /** Order / request detail rows */
  details?: EmailDetailRow[];
  /** Tracking token shown in a highlighted box */
  trackingToken?: string;
  trackingLabel?: string;
  /** Primary CTA */
  ctaUrl?: string;
  ctaLabel?: string;
  /** Extra HTML already escaped / trusted markup for secondary content */
  extraHtml?: string;
  /** Closing note paragraphs */
  note?: string | string[];
  /** Footer override */
  footerNote?: string;
  /**
   * Logo URL override. Default: cid inline (SMTP) which email clients can show
   * even when the site URL is localhost.
   */
  logoSrc?: string;
};

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function asLines(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value];
}

/** Absolute path to the logo file embedded in emails. */
export function getEmailLogoFilePath(): string {
  const candidates = [
    path.join(process.cwd(), "public", "logos", "email-logo.jpg"),
    path.join(process.cwd(), "public", "logos", "email-logo.png"),
    path.join(process.cwd(), "public", "logos", "logo-en.png"),
    path.join(process.cwd(), "public", "logos", "logo-ar.png"),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}

/**
 * Public https logo URL — preferred for Gmail (no paperclip attachment).
 * Never returns localhost — email clients cannot fetch it.
 */
export function getEmailLogoPublicUrl(): string {
  ensureServerEnv();
  const custom = process.env.EMAIL_LOGO_URL?.trim();
  if (custom) return custom;

  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (
    fromEnv &&
    !fromEnv.includes("localhost") &&
    !fromEnv.includes("127.0.0.1")
  ) {
    return `${fromEnv}${EMAIL_LOGO_PUBLIC_PATH}`;
  }

  return `https://servicetime.com.sa${EMAIL_LOGO_PUBLIC_PATH}`;
}

export function getEmailLogoSrc(options?: {
  preferCid?: boolean;
}): string {
  // SMTP default: CID (hosted HTTPS is blocked by Gmail until CSP-free logos are deployed).
  if (options?.preferCid !== false) return `cid:${EMAIL_LOGO_CID}`;
  return getEmailLogoPublicUrl();
}

/**
 * Detail rows as stacked RTL blocks — reliable in Gmail (ignores table dir).
 * Label on top (right), value below (right).
 */
function renderDetailRows(rows: EmailDetailRow[]): string {
  if (!rows.length) return "";

  const blocks = rows
    .map((row) => {
      const value = escapeHtml(row.value || "—");
      const valueHtml = row.ltr
        ? `<span dir="ltr" style="unicode-bidi:embed;direction:ltr;">${value}</span>`
        : value;
      return `
        <tr>
          <td align="right" dir="rtl" style="padding:12px 0;border-bottom:1px solid #e8eee9;text-align:right;direction:rtl;vertical-align:top;">
            <div style="font-size:12px;line-height:1.6;color:#5b6b63;margin:0 0 4px;text-align:right;direction:rtl;">
              ${escapeHtml(row.label)}
            </div>
            <div style="font-size:15px;line-height:1.6;color:#050B10;font-weight:700;text-align:right;direction:rtl;">
              ${valueHtml}
            </div>
          </td>
        </tr>`;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="border-collapse:collapse;margin:0 0 20px;direction:rtl;width:100%;">
      ${blocks}
    </table>`;
}

/**
 * Unified, responsive Service Time email shell (forced RTL, branded).
 */
export function renderServiceTimeEmail(
  options: ServiceTimeEmailOptions,
): string {
  ensureServerEnv();
  const logoSrc = options.logoSrc ?? getEmailLogoSrc({ preferCid: true });
  const siteUrl = absoluteUrl("/");
  const publicSite =
    siteUrl.includes("localhost") || siteUrl.includes("127.0.0.1")
      ? "https://servicetime.com.sa"
      : siteUrl;
  const year = new Date().getFullYear();
  const title = escapeHtml(options.title);
  const rtlText =
    "margin:0 0 12px;font-size:15px;line-height:1.75;color:#2a3530;text-align:right;direction:rtl;";

  const greeting = options.greeting
    ? `<p align="right" dir="rtl" style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#050B10;text-align:right;direction:rtl;">${escapeHtml(options.greeting)}</p>`
    : "";
  const intro = asLines(options.intro)
    .map(
      (line) =>
        `<p align="right" dir="rtl" style="${rtlText}">${escapeHtml(line)}</p>`,
    )
    .join("");
  const notes = asLines(options.note)
    .map(
      (line) =>
        `<p align="right" dir="rtl" style="margin:16px 0 0;font-size:13px;line-height:1.7;color:#6b7a73;text-align:right;direction:rtl;">${escapeHtml(line)}</p>`,
    )
    .join("");

  const statusBadge = options.statusLabel
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin:0 0 18px;direction:rtl;">
        <tr>
          <td align="right" dir="rtl" style="text-align:right;direction:rtl;">
            <span style="display:inline-block;padding:8px 14px;border-radius:999px;background:#e8f7ef;color:#0f5132;font-size:13px;font-weight:700;">
              ${escapeHtml(options.statusLabel)}
            </span>
          </td>
        </tr>
      </table>`
    : "";

  const tracking = options.trackingToken
    ? `
      <div style="margin:0 0 20px;padding:16px 18px;border-radius:14px;background:#f3faf6;border:1px solid #cfe9dc;text-align:center;">
        <p align="center" dir="rtl" style="margin:0 0 8px;font-size:12px;color:#5b6b63;font-weight:600;text-align:center;direction:rtl;">
          ${escapeHtml(options.trackingLabel ?? "رمز التتبع")}
        </p>
        <p dir="ltr" style="margin:0;font-size:22px;line-height:1.4;font-weight:800;letter-spacing:3px;color:#0f5132;font-family:Consolas,'Courier New',monospace;text-align:center;direction:ltr;">
          ${escapeHtml(options.trackingToken)}
        </p>
      </div>`
    : "";

  const cta =
    options.ctaUrl && options.ctaLabel
      ? `
      <table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:0 auto 8px;">
        <tr>
          <td align="center" style="border-radius:14px;background:#0f5132;">
            <a href="${escapeHtml(options.ctaUrl)}"
               style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:14px;">
              ${escapeHtml(options.ctaLabel)}
            </a>
          </td>
        </tr>
      </table>`
      : "";

  const footerNote = escapeHtml(
    options.footerNote ??
      "رسالة آلية من Service Time — يرجى عدم الرد مباشرة على هذا البريد إلا عند الحاجة.",
  );

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${title}</title>
</head>
<body dir="rtl" style="margin:0;padding:0;background:#eef3f0;font-family:Tahoma,Arial,Helvetica,sans-serif;-webkit-text-size-adjust:100%;direction:rtl;text-align:right;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${title} — ${SITE_NAME}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="background:#eef3f0;padding:24px 12px;direction:rtl;">
    <tr>
      <td align="center" style="direction:rtl;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:600px;border-collapse:separate;border-spacing:0;direction:rtl;margin:0 auto;">
          <tr>
            <td align="center" style="padding:22px 24px;background:#ffffff;border:1px solid #dde6e0;border-bottom:0;border-radius:18px 18px 0 0;text-align:center;">
              <a href="${escapeHtml(publicSite)}" style="text-decoration:none;display:inline-block;border:0;">
                <img src="${escapeHtml(logoSrc)}" alt="${escapeHtml(SITE_NAME)}" width="160"
                  style="display:block;margin:0 auto;max-width:160px;width:160px;height:auto;border:0;outline:none;" />
              </a>
            </td>
          </tr>
          <tr>
            <td align="right" dir="rtl" style="background:#ffffff;padding:28px 24px 8px;border-left:1px solid #dde6e0;border-right:1px solid #dde6e0;text-align:right;direction:rtl;">
              <h1 align="right" dir="rtl" style="margin:0 0 16px;font-size:22px;line-height:1.45;color:#050B10;font-weight:800;text-align:right;direction:rtl;">
                ${title}
              </h1>
              ${greeting}
              ${intro}
              ${statusBadge}
              ${renderDetailRows(options.details ?? [])}
              ${tracking}
              ${cta}
              ${options.extraHtml ?? ""}
              ${notes}
            </td>
          </tr>
          <tr>
            <td align="right" dir="rtl" style="background:#f7fbf8;padding:22px 24px;border:1px solid #dde6e0;border-top:0;border-radius:0 0 18px 18px;text-align:right;direction:rtl;">
              <p align="right" dir="rtl" style="margin:0 0 8px;font-size:14px;font-weight:700;color:#050B10;text-align:right;direction:rtl;">${escapeHtml(SITE_NAME)}</p>
              <p align="right" dir="rtl" style="margin:0 0 4px;font-size:12px;line-height:1.7;color:#5b6b63;text-align:right;direction:rtl;">
                <a href="tel:${escapeHtml(SITE_PHONE.replace(/\s/g, ""))}" style="color:#0f5132;text-decoration:none;" dir="ltr">${escapeHtml(SITE_PHONE)}</a>
                &nbsp;·&nbsp;
                <a href="mailto:${escapeHtml(SITE_EMAIL)}" style="color:#0f5132;text-decoration:none;" dir="ltr">${escapeHtml(SITE_EMAIL)}</a>
              </p>
              <p align="right" dir="rtl" style="margin:0 0 10px;font-size:12px;line-height:1.7;color:#5b6b63;text-align:right;direction:rtl;">
                <a href="${escapeHtml(publicSite)}" style="color:#0f5132;text-decoration:none;" dir="ltr">${escapeHtml(publicSite.replace(/^https?:\/\//, ""))}</a>
              </p>
              <p align="right" dir="rtl" style="margin:0;font-size:11px;line-height:1.6;color:#8a9690;text-align:right;direction:rtl;">
                ${footerNote}<br />
                © ${year} ${escapeHtml(SITE_NAME)}. جميع الحقوق محفوظة.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/h1>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function getEmailLogoDataUri(): string | null {
  const filePath = getEmailLogoFilePath();
  const resolved = fs.existsSync(filePath)
    ? filePath
    : path.join(process.cwd(), "public", "logos", "banner.png");
  if (!fs.existsSync(resolved)) return null;
  const buffer = fs.readFileSync(resolved);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export function getEmailLogoAttachment():
  | {
      filename: false;
      content: Buffer;
      cid: string;
      contentType: string;
      contentDisposition: "inline";
    }
  | null {
  const filePath = getEmailLogoFilePath();
  const resolved = fs.existsSync(filePath)
    ? filePath
    : path.join(process.cwd(), "public", "logos", "logo-en.png");
  if (!fs.existsSync(resolved)) return null;
  const isJpeg = /\.jpe?g$/i.test(resolved);
  return {
    // Omit filename so Gmail is less likely to show a paperclip attachment.
    filename: false,
    content: fs.readFileSync(resolved),
    cid: EMAIL_LOGO_CID,
    contentType: isJpeg ? "image/jpeg" : "image/png",
    contentDisposition: "inline",
  };
}
