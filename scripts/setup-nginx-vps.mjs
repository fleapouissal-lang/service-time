#!/usr/bin/env node
/**
 * Install nginx reverse proxy for servicetime.com.sa → :3000 (+ optional SSL)
 * Usage: DEPLOY_SSH_PASSWORD='...' node scripts/setup-nginx-vps.mjs
 */
import { Client } from "ssh2";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.DEPLOY_SSH_HOST || "167.86.106.140";
const password = process.env.DEPLOY_SSH_PASSWORD;
const domain = process.env.DEPLOY_DOMAIN || "servicetime.com.sa";
if (!password) {
  console.error("Set DEPLOY_SSH_PASSWORD");
  process.exit(1);
}

const nginxConf = readFileSync(
  join(root, "scripts/nginx-service-time.conf"),
  "utf8",
);

const remoteScript = `#!/bin/bash
set -euo pipefail
DOMAIN="${domain}"

echo "=== PORTS BEFORE ==="
ss -lntp | grep -E ':(80|443|3000)' || true

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y nginx

mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cp /root/nginx-service-time.conf /etc/nginx/sites-available/service-time
ln -sfn /etc/nginx/sites-available/service-time /etc/nginx/sites-enabled/service-time
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx

if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

echo "=== PORTS AFTER ==="
ss -lntp | grep -E ':(80|443|3000)' || true

echo "=== LOCAL TESTS ==="
curl -sS -o /dev/null -w "IP3000=%{http_code}\\n" http://127.0.0.1:3000/
curl -sS -o /dev/null -w "HTTP80=%{http_code}\\n" -H "Host: $DOMAIN" http://127.0.0.1/
curl -sS -o /dev/null -w "DOMAIN_HTTP=%{http_code}\\n" --connect-timeout 10 "http://$DOMAIN/" || echo DOMAIN_HTTP=FAIL

apt-get install -y certbot python3-certbot-nginx
certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "admin@$DOMAIN" --redirect \\
  && echo CERTBOT_OK || echo CERTBOT_SKIPPED

echo "=== FINAL PORTS ==="
ss -lntp | grep -E ':(80|443|3000)' || true
curl -sS -o /dev/null -w "HTTPS=%{http_code}\\n" --connect-timeout 10 "https://$DOMAIN/" || echo HTTPS=FAIL
curl -sS -o /dev/null -w "HTTP=%{http_code}\\n" --connect-timeout 10 "http://$DOMAIN/" || echo HTTP=FAIL

cd /root/service-time
python3 - <<PY
from pathlib import Path
import urllib.request
domain = "${domain}"
app = f"http://{domain}"
secure = "false"
try:
    urllib.request.urlopen(f"https://{domain}/", timeout=8)
    app = f"https://{domain}"
    secure = "true"
except Exception as e:
    print("https_probe_fail", e)

p = Path("/root/service-time/.env")
text = p.read_text(encoding="utf-8") if p.exists() else ""
lines = []
seen_url = seen_secure = False
for line in text.splitlines():
    if line.startswith("NEXT_PUBLIC_APP_URL="):
        lines.append(f"NEXT_PUBLIC_APP_URL={app}")
        seen_url = True
    elif line.startswith("AUTH_COOKIE_SECURE="):
        lines.append(f"AUTH_COOKIE_SECURE={secure}")
        seen_secure = True
    else:
        lines.append(line)
if not seen_url:
    lines.append(f"NEXT_PUBLIC_APP_URL={app}")
if not seen_secure:
    lines.append(f"AUTH_COOKIE_SECURE={secure}")
p.write_text("\\n".join(lines).rstrip() + "\\n", encoding="utf-8")
print("APP_URL=", app, "AUTH_COOKIE_SECURE=", secure)
PY

npm run sync-env
pm2 restart service-time --update-env
sleep 3
curl -sS -o /dev/null -w "HOME=%{http_code}\\n" -H "Host: $DOMAIN" http://127.0.0.1/
echo DONE
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
      stream.on("close", (code) =>
        code === 0 ? resolve(out) : reject(new Error(`exit ${code}`)),
      );
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
    .connect({ host, port: 22, username: "root", password, readyTimeout: 45000 });
});

console.log("SSH OK — installing nginx…");
await upload(conn, join(root, "scripts/nginx-service-time.conf"), "/root/nginx-service-time.conf");
await writeRemote(conn, "/root/setup-nginx.sh", remoteScript);
try {
  await exec(conn, "bash /root/setup-nginx.sh; rm -f /root/setup-nginx.sh /root/nginx-service-time.conf");
} finally {
  conn.end();
}
console.log("Done.");
