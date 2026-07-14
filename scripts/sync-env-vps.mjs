#!/usr/bin/env node
/**
 * Sync selected .env values from local → VPS (keeps production APP_URL / AUTH_COOKIE_SECURE).
 * Usage: DEPLOY_SSH_PASSWORD='...' node scripts/sync-env-vps.mjs
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

const SYNC_KEYS = [
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
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DATABASE_URL",
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

const local = parseEnv(readFileSync(join(root, ".env"), "utf8"));
const payload = {};
for (const k of SYNC_KEYS) {
  if (local[k] !== undefined) payload[k] = local[k];
}

const remoteScript = `#!/bin/bash
set -euo pipefail
cd /root/service-time
python3 - <<'PY'
import json
from pathlib import Path

payload = json.loads(${JSON.stringify(JSON.stringify(payload))})
p = Path("/root/service-time/.env")
text = p.read_text(encoding="utf-8") if p.exists() else ""
lines = text.splitlines()
keys = set(payload)
out = []
seen = set()
for line in lines:
    raw = line.strip()
    if not raw or raw.startswith("#") or "=" not in raw:
        out.append(line)
        continue
    k = raw.split("=", 1)[0].strip()
    if k in keys:
        out.append(f"{k}={payload[k]}")
        seen.add(k)
    else:
        out.append(line)
for k, v in payload.items():
    if k not in seen:
        out.append(f"{k}={v}")

# Force production URL / cookie flags
forced = {
    "NEXT_PUBLIC_APP_URL": "http://167.86.106.140:3000",
    "AUTH_COOKIE_SECURE": "false",
}
final = []
seen_f = set()
for line in out:
    raw = line.strip()
    if raw and not raw.startswith("#") and "=" in raw:
        k = raw.split("=", 1)[0].strip()
        if k in forced:
            final.append(f"{k}={forced[k]}")
            seen_f.add(k)
            continue
    final.append(line)
for k, v in forced.items():
    if k not in seen_f:
        final.append(f"{k}={v}")

p.write_text("\\n".join(final).rstrip() + "\\n", encoding="utf-8")
print("env updated keys:", ",".join(sorted(payload)))
PY

npm run sync-env
pm2 restart service-time --update-env
sleep 2
curl -sS -o /dev/null -w "HTTP_HOME=%{http_code}\\n" http://127.0.0.1:3000/
# quick sanity: SMTP_USER not empty
python3 - <<'PY'
from pathlib import Path
text = Path("/root/service-time/.env").read_text(encoding="utf-8")
def get(k):
    for line in text.splitlines():
        if line.startswith(k+"="):
            return line.split("=",1)[1].strip()
    return ""
checks = ["SMTP_USER","SMTP_PASS","CONTACT_NOTIFY_EMAIL","WHATSAPP_NUMBER","NEXT_PUBLIC_APP_URL","NEXT_PUBLIC_SUPABASE_URL"]
for k in checks:
    v = get(k)
    print(f"CHECK {k}={'SET' if v else 'EMPTY'}{' '+v if k in ('NEXT_PUBLIC_APP_URL','NEXT_PUBLIC_SUPABASE_URL') else ''}")
PY
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

console.log("SSH OK — syncing env…");
await writeRemote(conn, "/root/sync-env-vps.sh", remoteScript);
try {
  await exec(conn, "bash /root/sync-env-vps.sh; rm -f /root/sync-env-vps.sh");
} finally {
  conn.end();
}
console.log("Done.");
