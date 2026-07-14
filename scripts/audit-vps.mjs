#!/usr/bin/env node
/**
 * Audit VPS: git, env, pm2, http, db keepalive, missing keys vs local .env
 * Usage: DEPLOY_SSH_PASSWORD='...' node scripts/audit-vps.mjs
 */
import { Client } from "ssh2";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const host = process.env.DEPLOY_SSH_HOST || "167.86.106.140";
const password = process.env.DEPLOY_SSH_PASSWORD;
if (!password) {
  console.error("Set DEPLOY_SSH_PASSWORD");
  process.exit(1);
}

const REQUIRED = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
  "NEXT_PUBLIC_APP_URL",
];

const IMPORTANT = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASS",
  "EMAIL_FROM",
  "CONTACT_NOTIFY_EMAIL",
  "PASSWORD_RESET_SECRET",
  "WHATSAPP_NUMBER",
  "WHATSAPP_ACCESS_TOKEN",
  "WHATSAPP_PHONE_NUMBER_ID",
  "PAYMOB_BASE_URL",
  "PAYMOB_SECRET_KEY",
  "NEXT_PUBLIC_PAYMOB_PUBLIC_KEY",
  "PAYMOB_INTEGRATION_IDS",
  "PAYMOB_HMAC_SECRET",
  "AUTH_COOKIE_SECURE",
];

function parseEnv(text) {
  const map = {};
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    map[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return map;
}

function mask(v) {
  if (!v) return "(empty)";
  if (v.length <= 8) return "***";
  return `${v.slice(0, 6)}…${v.slice(-4)} (len=${v.length})`;
}

const localEnv = parseEnv(readFileSync(join(root, ".env"), "utf8"));

const remoteScript = `#!/bin/bash
set -euo pipefail
cd /root/service-time

echo "===== GIT ====="
git remote -v
git status -sb
git log -1 --oneline
echo "GIT_HEAD=$(git rev-parse HEAD)"

echo "===== NODE / PM2 ====="
node -v
npm -v
pm2 describe service-time 2>/dev/null | head -40 || pm2 list
echo "--- pm2 jlist ---"
pm2 jlist 2>/dev/null | head -c 4000 || true

echo "===== PORTS ====="
ss -lntp | grep -E ':3000|:22' || true
curl -sS -o /dev/null -w "HTTP_HOME=%{http_code} time=%{time_total}\\n" http://127.0.0.1:3000/ || echo "HTTP_HOME=FAIL"
curl -sS -o /dev/null -w "HTTP_LOGIN=%{http_code}\\n" http://127.0.0.1:3000/login || true
curl -sS -o /dev/null -w "HTTP_SPARE=%{http_code}\\n" http://127.0.0.1:3000/spare-parts || true

echo "===== CRON ====="
crontab -l 2>/dev/null || echo "(no crontab)"

echo "===== ENV FILES ====="
ls -la /root/service-time/.env /root/service-time/apps/web/.env.local 2>&1 || true

echo "===== ENV KEYS (masked) ====="
python3 - <<'PY'
from pathlib import Path
import re

def parse(p):
    m = {}
    if not Path(p).exists():
        return m
    for line in Path(p).read_text(encoding="utf-8", errors="replace").splitlines():
        t = line.strip()
        if not t or t.startswith("#") or "=" not in t:
            continue
        k, v = t.split("=", 1)
        m[k.strip()] = v.strip()
    return m

def mask(v):
    if not v:
        return "(empty)"
    if len(v) <= 8:
        return "***"
    return f"{v[:6]}…{v[-4:]} (len={len(v)})"

root = parse("/root/service-time/.env")
web = parse("/root/service-time/apps/web/.env.local")
print("ROOT_KEYS=" + ",".join(sorted(root)))
print("WEB_KEYS=" + ",".join(sorted(web)))
for k in sorted(set(root) | set(web)):
    rv, wv = root.get(k), web.get(k)
    sync = "OK" if rv == wv else ("MISSING_WEB" if rv and not wv else ("DIFF" if rv and wv else "WEB_ONLY"))
    print(f"KEY {k} root={mask(rv)} web={mask(wv)} sync={sync}")

url = root.get("NEXT_PUBLIC_SUPABASE_URL", "")
db = root.get("DATABASE_URL", "")
app = root.get("NEXT_PUBLIC_APP_URL", "")
print("CHECK_SUPABASE_HOST=" + ("OK" if "zrykldbnxpvcksbadync" in url else "BAD:" + url))
print("CHECK_DB_HOST=" + ("OK" if "zrykldbnxpvcksbadync" in db else "BAD"))
print("CHECK_APP_URL=" + ("OK" if "167.86.106.140:3000" in app else "CHECK:" + app))
print("CHECK_AUTH_SECURE=" + root.get("AUTH_COOKIE_SECURE", "(missing)"))
empty = [k for k,v in root.items() if not v]
print("EMPTY_ROOT=" + (",".join(empty) if empty else "(none)"))
PY

echo "===== KEEPALIVE / DB ====="
cd /root/service-time && npm run keepalive:db || echo "KEEPALIVE_FAIL"

echo "===== DISK ====="
df -h / | tail -1
du -sh /root/service-time /root/service-time/node_modules /root/service-time/apps/web/.next 2>/dev/null || true

echo "===== DONE ====="
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
      stream.on("close", (code) => resolve({ code, out }));
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
      readyTimeout: 45000,
    });
});

console.log("SSH OK — running audit…\n");
await writeRemote(conn, "/root/audit-vps.sh", remoteScript);
const { code, out } = await exec(conn, "bash /root/audit-vps.sh; rm -f /root/audit-vps.sh");
conn.end();

// Local comparison
const remoteKeysMatch = out.match(/ROOT_KEYS=([^\r\n]+)/);
const remoteKeys = remoteKeysMatch
  ? new Set(remoteKeysMatch[1].split(",").filter(Boolean))
  : new Set();

console.log("\n===== LOCAL vs VPS =====");
const missingRequired = REQUIRED.filter((k) => !remoteKeys.has(k));
const missingImportant = IMPORTANT.filter((k) => !remoteKeys.has(k));
const emptyOnLocal = [...REQUIRED, ...IMPORTANT].filter(
  (k) => localEnv[k] !== undefined && !localEnv[k],
);
const presentLocalMissingVps = Object.keys(localEnv).filter(
  (k) => localEnv[k] && !remoteKeys.has(k),
);

console.log("missing_required_on_vps:", missingRequired.join(", ") || "(none)");
console.log("missing_important_on_vps:", missingImportant.join(", ") || "(none)");
console.log("local_empty_important:", emptyOnLocal.join(", ") || "(none)");
console.log(
  "local_has_value_vps_missing:",
  presentLocalMissingVps.join(", ") || "(none)",
);

const httpOk = /HTTP_HOME=200/.test(out);
const dbOk = /\[keepalive\] ok/.test(out);
const supabaseOk = /CHECK_SUPABASE_HOST=OK/.test(out);
const verdict =
  httpOk && dbOk && supabaseOk && missingRequired.length === 0
    ? "PASS (core OK)"
    : "ISSUES FOUND";

console.log("\nVERDICT:", verdict);
if (presentLocalMissingVps.length || missingImportant.length) {
  console.log(
    "NOTE: SMTP/WhatsApp/Paymob may be incomplete on VPS — sync .env from local if needed.",
  );
}
process.exit(code === 0 && missingRequired.length === 0 ? 0 : 1);
