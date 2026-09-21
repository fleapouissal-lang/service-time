#!/usr/bin/env node
import { Client } from "ssh2";

const password = process.env.DEPLOY_SSH_PASSWORD;
if (!password) {
  console.error("Set DEPLOY_SSH_PASSWORD");
  process.exit(1);
}

const cmd = `#!/bin/bash
set -e
cd /root/service-time
echo "=== ENV ==="
grep -E '^(NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_SUPABASE_URL|AUTH_COOKIE_SECURE)=' .env
grep -E '^(NEXT_PUBLIC_APP_URL|NEXT_PUBLIC_SUPABASE_URL|AUTH_COOKIE_SECURE)=' apps/web/.env.local
echo "=== SUPABASE HEALTH ==="
URL=$(grep '^NEXT_PUBLIC_SUPABASE_URL=' .env | cut -d= -f2-)
curl -sS -o /tmp/sb.json -w "code=%{http_code}\\n" --connect-timeout 10 "$URL/auth/v1/health" || echo FAIL
head -c 200 /tmp/sb.json; echo
echo "=== LOGIN API FROM VPS ==="
curl -sS -o /tmp/login.json -w "code=%{http_code}\\n" --connect-timeout 15 \\
  -X POST https://servicetime.com.sa/api/auth/login \\
  -H 'content-type: application/json' \\
  -H 'origin: https://servicetime.com.sa' \\
  -d '{"emailOrPhone":"ouissalbenzahi@gmail.com","password":"wrong-password-test"}' || echo LOGIN_FAIL
head -c 500 /tmp/login.json; echo
echo "=== PM2 ERR ==="
pm2 logs service-time --err --lines 30 --nostream | tail -40
`;

const conn = new Client();
await new Promise((resolve, reject) => {
  conn
    .on("ready", resolve)
    .on("error", reject)
    .connect({
      host: "167.86.106.140",
      username: "root",
      password,
      readyTimeout: 45000,
    });
});

await new Promise((resolve, reject) => {
  conn.sftp((err, sftp) => {
    if (err) return reject(err);
    const ws = sftp.createWriteStream("/root/check-login.sh");
    ws.on("close", resolve);
    ws.on("error", reject);
    ws.end(cmd);
  });
});

await new Promise((resolve, reject) => {
  conn.exec("bash /root/check-login.sh; rm -f /root/check-login.sh", (err, stream) => {
    if (err) return reject(err);
    stream.on("data", (d) => process.stdout.write(d));
    stream.stderr.on("data", (d) => process.stderr.write(d));
    stream.on("close", (code) => (code === 0 ? resolve() : reject(new Error("exit " + code))));
  });
});
conn.end();
