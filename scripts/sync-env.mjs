import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, ".env");
const webEnvPath = join(root, "apps", "web", ".env.local");

/** Variables serveur copiées vers apps/web/.env.local pour les API routes Next.js */
const SERVER_KEYS = new Set([
  "SUPABASE_SERVICE_ROLE_KEY",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "CONTACT_NOTIFY_EMAIL",
  "PASSWORD_RESET_SECRET",
  "RESEND_API_KEY",
  "WHATSAPP_NUMBER",
]);

if (!existsSync(envPath)) {
  console.warn("⚠️  .env introuvable à la racine — Supabase non configuré.");
  process.exit(0);
}

const content = readFileSync(envPath, "utf8");
const lines = content.split("\n");
const webVars = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;

  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;

  const key = trimmed.slice(0, eq).trim();
  if (key.startsWith("NEXT_PUBLIC_") || SERVER_KEYS.has(key)) {
    webVars.push(trimmed);
  }
}

if (webVars.length === 0) {
  console.warn("⚠️  Variables web manquantes dans .env");
  process.exit(0);
}

const output = [
  "# Généré par scripts/sync-env.mjs — ne pas éditer à la main",
  "# Source : .env à la racine du monorepo",
  "# SUPABASE_SERVICE_ROLE_KEY, SMTP_* = serveur uniquement",
  "",
  ...webVars,
  "",
].join("\n");

writeFileSync(webEnvPath, output, "utf8");
console.log("✓ Variables synchronisées → apps/web/.env.local");
