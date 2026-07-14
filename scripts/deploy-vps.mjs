#!/usr/bin/env node
/**
 * Deploy / bootstrap Service Time on VPS via ssh2.
 * Usage: DEPLOY_SSH_PASSWORD='...' node scripts/deploy-vps.mjs
 */
import { Client } from "ssh2";
import { execSync } from "node:child_process";
import { unlinkSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.DEPLOY_SSH_HOST || "167.86.106.140";
const password = process.env.DEPLOY_SSH_PASSWORD;
if (!password) {
  console.error("Set DEPLOY_SSH_PASSWORD");
  process.exit(1);
}

const bundleLocal = join(root, ".deploy.bundle");
console.log("Creating git bundle...");
execSync("git bundle create .deploy.bundle master", {
  cwd: root,
  stdio: "inherit",
});

const remoteScript = `#!/bin/bash
set -euo pipefail

echo "=== FREE SPACE ==="
rm -rf /root/.npm/_cacache /tmp/* 2>/dev/null || true
df -h / | tail -1

# Bootstrap repo if missing (fresh VPS)
if [ ! -d /root/service-time/.git ]; then
  echo "=== BOOTSTRAP REPO FROM BUNDLE ==="
  rm -rf /root/service-time
  git clone /root/deploy.bundle /root/service-time
  cd /root/service-time
  git checkout master || git checkout -b master
else
  cd /root/service-time
  echo "=== IMPORT BUNDLE ==="
  git fetch /root/deploy.bundle master:refs/remotes/bundle/master
  git reset --hard refs/remotes/bundle/master
fi

# Point origin at GitHub so \`git pull\` works on the VPS (bundle is deleted after deploy)
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/fleapouissal-lang/service-time.git
git remote set-url origin https://github.com/fleapouissal-lang/service-time.git
git fetch origin 2>/dev/null || true

echo "=== HEAD ==="
git log -1 --oneline

# Ensure node/npm/pm2
if ! command -v node >/dev/null 2>&1; then
  echo "=== INSTALL NODE 22 ==="
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y nodejs
fi
npm install -g pm2 >/dev/null 2>&1 || true
node -v
npm -v

python3 - <<'PY'
from pathlib import Path
p = Path("/root/service-time/.env")
text = p.read_text(encoding="utf-8") if p.exists() else ""
replacements = {
    "NEXT_PUBLIC_SUPABASE_URL": "https://zrykldbnxpvcksbadync.supabase.co",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeWtsZGJueHB2Y2tzYmFkeW5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMxNTc1ODMsImV4cCI6MjA5ODczMzU4M30.ay6bzAQc3PvkWZyYEWOYujAIZtWcLyp2WgE75yWH9y4",
    "SUPABASE_SERVICE_ROLE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpyeWtsZGJueHB2Y2tzYmFkeW5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE1NzU4MywiZXhwIjoyMDk4NzMzNTgzfQ.Z1uOytp9B0zYfNX6KpHxTeDpNXIRZmgwKj9Y68AsrSg",
    "DATABASE_URL": "postgresql://postgres.zrykldbnxpvcksbadync:mohammeD%402001123%2F@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres",
    "NEXT_PUBLIC_APP_URL": "http://167.86.106.140:3000",
    "AUTH_COOKIE_SECURE": "false",
}
# Keep minimal defaults if brand new env
if not text.strip():
    text = """# Service Time production env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=Service Time <noreply@servicetime.sa>
CONTACT_NOTIFY_EMAIL=
PASSWORD_RESET_SECRET=e011b6f2ae5f4c96d0b252c3ddb095933992d55eb7557a06fa7ef4c9b4cd4be4
WHATSAPP_NUMBER=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
PAYMOB_BASE_URL=https://ksa.paymob.com
PAYMOB_SECRET_KEY=
NEXT_PUBLIC_PAYMOB_PUBLIC_KEY=
PAYMOB_INTEGRATION_IDS=
PAYMOB_HMAC_SECRET=
"""
lines = text.splitlines()
seen = set()
out = []
for line in lines:
    if not line.strip() or line.strip().startswith("#") or "=" not in line:
        out.append(line)
        continue
    key = line.split("=", 1)[0].strip()
    if key in replacements:
        out.append(f"{key}={replacements[key]}")
        seen.add(key)
    else:
        out.append(line)
for key, value in replacements.items():
    if key not in seen:
        out.append(f"{key}={value}")
p.write_text("\\n".join(out).rstrip() + "\\n", encoding="utf-8")
print("env updated")
PY

rm -rf apps/web/.next .turbo 2>/dev/null || true
npm install --prefer-offline
npm run sync-env
export NODE_OPTIONS=--max-old-space-size=1536
npm run build:web
echo "BUILD_ID=$(cat apps/web/.next/BUILD_ID)"

# Start/restart PM2
if pm2 describe service-time >/dev/null 2>&1; then
  pm2 restart service-time --update-env
else
  npm run pm2:prod || pm2 start npm --name service-time -- run start:web
fi
pm2 save
pm2 status

mkdir -p /root/service-time/logs
CRON_FILE=/tmp/service-time.cron
crontab -l 2>/dev/null | grep -v 'keepalive-db.mjs' | grep -v 'clear-web-cache.mjs' > "$CRON_FILE" || true
cat >> "$CRON_FILE" <<'CRON'
0 6 */4 * * cd /root/service-time && /usr/bin/node scripts/keepalive-db.mjs >> /root/service-time/logs/keepalive.log 2>&1
15 3 * * 0 cd /root/service-time && /usr/bin/node scripts/clear-web-cache.mjs >> /root/service-time/logs/cache-clear.log 2>&1
CRON
crontab "$CRON_FILE"
rm -f "$CRON_FILE"
echo "CRON:"
crontab -l | grep -E 'keepalive|clear-web-cache' || true

npm run keepalive:db || true
sleep 3
curl -s -o /dev/null -w "HOME_%{http_code}\\n" http://127.0.0.1:3000/ || true
rm -f /root/deploy.bundle
echo "=== DONE ==="
`;

function exec(conn, command) {
  return new Promise((resolve, reject) => {
    conn.exec(command, { pty: true }, (err, stream) => {
      if (err) return reject(err);
      let out = "";
      stream.on("data", (d) => {
        const s = d.toString();
        out += s;
        process.stdout.write(s);
      });
      stream.stderr?.on("data", (d) => {
        const s = d.toString();
        out += s;
        process.stderr.write(s);
      });
      stream.on("close", (code) => {
        if (code === 0) resolve(out);
        else reject(new Error(`Remote exit ${code}`));
      });
    });
  });
}

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

const conn = new Client();
await new Promise((resolve, reject) => {
  conn
    .on("ready", resolve)
    .on("error", reject)
    .connect({
      host,
      port: 22,
      username: "root",
      password,
      readyTimeout: 30000,
    });
});

console.log("SSH connected. Uploading bundle...");
await upload(conn, bundleLocal, "/root/deploy.bundle");
await writeRemote(conn, "/root/deploy-run.sh", remoteScript);
console.log("Running deploy (this can take several minutes)...");

try {
  await exec(conn, "bash /root/deploy-run.sh; rm -f /root/deploy-run.sh");
} finally {
  conn.end();
  try {
    unlinkSync(bundleLocal);
  } catch {}
  console.log("Done.");
}
