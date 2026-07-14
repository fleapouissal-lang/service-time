#!/usr/bin/env node
import { Client } from "ssh2";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const password = process.env.DEPLOY_SSH_PASSWORD || "3zcyEyt^St23ylXx";
const host = process.env.DEPLOY_SSH_HOST || "167.86.106.140";

const files = [
  "apps/web/components/layout/site-footer.tsx",
  "apps/web/lib/seo.ts",
  "apps/web/app/contact/page.tsx",
  "apps/web/messages/legal/en.ts",
  "apps/web/messages/legal/ar.ts",
];

function upload(conn, local, remote) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      sftp.fastPut(local, remote, (e) => (e ? reject(e) : resolve()));
    });
  });
}

function writeRemote(conn, remote, content) {
  return new Promise((resolve, reject) => {
    conn.sftp((err, sftp) => {
      if (err) return reject(err);
      const ws = sftp.createWriteStream(remote);
      ws.on("close", resolve);
      ws.on("error", reject);
      ws.end(content.replace(/\r\n/g, "\n"));
    });
  });
}

function exec(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      stream.on("data", (d) => process.stdout.write(d));
      stream.stderr?.on("data", (d) => process.stderr.write(d));
      stream.on("close", (code) =>
        code === 0 ? resolve() : reject(new Error("exit " + code)),
      );
    });
  });
}

const localEnv = readFileSync(join(root, ".env"), "utf8");
function localGet(k) {
  const m = localEnv.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

const smtpUser = localGet("SMTP_USER");
const smtpPass = localGet("SMTP_PASS");
const emailFrom = localGet("EMAIL_FROM");
const contactNotify = localGet("CONTACT_NOTIFY_EMAIL");

const remoteScript = `#!/bin/bash
set -euo pipefail
cd /root/service-time

python3 - <<'PY'
from pathlib import Path
p = Path(".env")
text = p.read_text(encoding="utf-8") if p.exists() else ""
updates = {
    "SMTP_HOST": "smtp.gmail.com",
    "SMTP_PORT": "587",
    "SMTP_USER": ${JSON.stringify(smtpUser)},
    "SMTP_PASS": ${JSON.stringify(smtpPass)},
    "EMAIL_FROM": ${JSON.stringify(emailFrom)},
    "CONTACT_NOTIFY_EMAIL": ${JSON.stringify(contactNotify)},
    "NEXT_PUBLIC_APP_URL": "https://servicetime.com.sa",
    "AUTH_COOKIE_SECURE": "true",
}
lines = []
seen = set()
for line in text.splitlines():
    raw = line.strip()
    if raw and not raw.startswith("#") and "=" in raw:
        k = raw.split("=", 1)[0].strip()
        if k in updates:
            lines.append(f"{k}={updates[k]}")
            seen.add(k)
            continue
    lines.append(line)
for k, v in updates.items():
    if k not in seen:
        lines.append(f"{k}={v}")
p.write_text("\\n".join(lines).rstrip() + "\\n", encoding="utf-8")
print("SMTP_USER=", updates["SMTP_USER"])
print("EMAIL_FROM=", updates["EMAIL_FROM"])
print("CONTACT_NOTIFY=", updates["CONTACT_NOTIFY_EMAIL"])
print("SMTP_PASS_SET=", "yes" if updates["SMTP_PASS"] else "no")
PY

npm run sync-env
NODE_OPTIONS=--max-old-space-size=1536 npm run build:web
pm2 restart service-time --update-env
sleep 4
curl -sS -o /dev/null -w "HOME=%{http_code}\\n" https://servicetime.com.sa/
curl -sS https://servicetime.com.sa/ | grep -o 'servicetime10@gmail.com' | head -3 || echo "EMAIL_NOT_IN_HOME"
curl -sS https://servicetime.com.sa/contact | grep -o 'servicetime10@gmail.com' | head -3 || echo "EMAIL_NOT_IN_CONTACT"
node scripts/test-smtp.mjs servicetime10@gmail.com || true
echo DONE
`;

const conn = new Client();
await new Promise((r, j) =>
  conn.on("ready", r).on("error", j).connect({
    host,
    username: "root",
    password,
    readyTimeout: 45000,
  }),
);

console.log("SSH OK — updating email on VPS…");
for (const rel of files) {
  await upload(conn, join(root, rel), `/root/service-time/${rel}`);
  console.log("uploaded", rel);
}

await writeRemote(conn, "/root/patch-email-vps.sh", remoteScript);
try {
  await exec(conn, "bash /root/patch-email-vps.sh; rm -f /root/patch-email-vps.sh");
} finally {
  conn.end();
}
console.log("Done.");
