#!/usr/bin/env node
/** Test envoi SMTP Gmail — node scripts/test-smtp.mjs */
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });
dotenv.config({ path: join(root, "apps/web/.env.local") });

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim().replace(/\s/g, "");
const to = process.argv[2] ?? user;

if (!user || !pass) {
  console.error("❌ SMTP_USER / SMTP_PASS manquants");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: false,
  auth: { user, pass },
});

try {
  await transporter.verify();
  console.log("✓ Connexion SMTP OK");
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? user,
    to,
    subject: "Test Service Time",
    text: "Si tu reçois ce mail, SMTP Gmail fonctionne.",
  });
  console.log("✓ Email envoyé:", info.messageId);
} catch (err) {
  console.error("❌", err.message);
  process.exit(1);
}
