#!/usr/bin/env node
/** Vérifie la config email sans exposer les secrets — node scripts/check-email-env.mjs */
import dotenv from "dotenv";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });
dotenv.config({ path: join(root, "apps/web/.env.local") });

const smtpUser = process.env.SMTP_USER?.trim();
const smtpPass = process.env.SMTP_PASS?.trim();
const resend = process.env.RESEND_API_KEY?.trim();
const webEnv = join(root, "apps/web/.env.local");

console.log("=== Config email Service Time ===\n");
console.log(`apps/web/.env.local : ${existsSync(webEnv) ? "✓ présent" : "✗ absent — lancez npm run sync-env"}`);
console.log(`SMTP_USER           : ${smtpUser ? `✓ ${smtpUser}` : "✗ manquant"}`);
console.log(`SMTP_PASS           : ${smtpPass ? "✓ défini" : "✗ manquant"}`);
console.log(`SMTP_HOST           : ${process.env.SMTP_HOST?.trim() || "smtp.gmail.com (défaut)"}`);
console.log(`SMTP_PORT           : ${process.env.SMTP_PORT?.trim() || "587 (défaut)"}`);
console.log(`EMAIL_FROM          : ${process.env.EMAIL_FROM?.trim() || "(SMTP_USER par défaut)"}`);
console.log(`RESEND_API_KEY      : ${resend ? "✓ défini" : "—"}`);

if (smtpUser && smtpPass) {
  console.log("\n→ Test réel : node scripts/test-smtp.mjs email-du-client@example.com");
} else if (resend) {
  console.log("\n→ Resend configuré (pas de test SMTP automatique ici)");
} else {
  console.log("\n✗ Aucun envoi possible — ajoutez SMTP_USER + SMTP_PASS dans .env puis npm run sync-env");
  process.exit(1);
}
