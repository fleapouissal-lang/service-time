#!/usr/bin/env node
/** Test envoi SMTP — node scripts/test-smtp.mjs destinataire@email.com */
import nodemailer from "nodemailer";
import net from "node:net";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });
dotenv.config({ path: join(root, "apps/web/.env.local") });

const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASS?.trim().replace(/\s/g, "");
const host = process.env.SMTP_HOST?.trim() || "smtp.gmail.com";
const port = Number(process.env.SMTP_PORT ?? 587);
const from =
  process.env.EMAIL_FROM?.trim() ?? (user ? `Service Time <${user}>` : user);
const to = process.argv[2]?.trim();

if (!to) {
  console.error("Usage: npm run test:smtp -- votre@email.com");
  console.error("       (remplacez par VOTRE vraie adresse, pas example.com)");
  process.exit(1);
}

if (/example\.(com|org|net)$/i.test(to.split("@")[1] ?? "")) {
  console.warn(
    "⚠️  example.com n'est pas une vraie boîte mail — utilisez votre Gmail/outlook réel.",
  );
}

if (!user || !pass) {
  console.error("❌ SMTP_USER / SMTP_PASS manquants dans .env");
  console.error("   → npm run sync-env");
  process.exit(1);
}

console.log("=== Test SMTP Service Time ===");
console.log(`Host     : ${host}:${port}`);
console.log(`User     : ${user}`);
console.log(`From     : ${from}`);
console.log(`To       : ${to}`);
console.log("");

function testTcp(hostName, hostPort) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: hostName, port: hostPort, timeout: 8000 });
    socket.on("connect", () => {
      socket.destroy();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });
  });
}

const tcpOk = await testTcp(host, port);
console.log(
  tcpOk
    ? `✓ Port ${port} ouvert vers ${host}`
    : `✗ Port ${port} bloqué vers ${host} (pare-feu VPS?) — essayez SMTP_PORT=465`,
);

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
  tls: { minVersion: "TLSv1.2" },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
});

try {
  await transporter.verify();
  console.log("✓ Authentification SMTP OK");

  const info = await transporter.sendMail({
    from,
    to,
    subject: "Test Service Time — SMTP",
    text: "Si vous recevez ce mail, SMTP fonctionne correctement sur ce serveur.",
    html: "<p>Si vous recevez ce mail, <strong>SMTP fonctionne</strong> sur ce serveur.</p>",
  });

  console.log("✓ Serveur SMTP a accepté l'envoi");
  console.log(`  messageId : ${info.messageId ?? "n/a"}`);
  console.log(`  accepted  : ${(info.accepted ?? []).join(", ") || to}`);
  if (info.rejected?.length) {
    console.log(`  rejected  : ${info.rejected.join(", ")}`);
  }
  console.log("");
  console.log("→ Vérifiez la boîte de réception ET les spams (1-2 min).");
  console.log("→ Gmail : le mot de passe doit être un mot de passe d'application, pas le mot de passe du compte.");
} catch (err) {
  console.error("");
  console.error("❌ Échec SMTP");
  console.error(`   ${err.message}`);
  if (err.code) console.error(`   code: ${err.code}`);
  if (err.response) console.error(`   response: ${err.response}`);
  console.error("");
  console.error("Causes fréquentes :");
  console.error("  • Gmail : créer un mot de passe d'application → https://myaccount.google.com/apppasswords");
  console.error("  • EMAIL_FROM doit utiliser la même adresse que SMTP_USER");
  console.error("  • VPS : port 587 bloqué → essayer SMTP_PORT=465 dans .env");
  process.exit(1);
}
