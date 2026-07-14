#!/usr/bin/env node
/**
 * Patch contact phone files on VPS + rebuild (uncommitted local changes).
 */
import { Client } from "ssh2";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const password = process.env.DEPLOY_SSH_PASSWORD;
if (!password) process.exit(1);

const files = [
  "apps/web/components/layout/site-footer.tsx",
  "apps/web/lib/seo.ts",
  "apps/web/lib/whatsapp.ts",
  "apps/web/lib/whatsapp-utils.ts",
  "apps/web/app/contact/page.tsx",
  "apps/web/messages/legal/en.ts",
  "apps/web/messages/legal/ar.ts",
  "apps/web/lib/paymob.ts",
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

const conn = new Client();
await new Promise((r, j) =>
  conn.on("ready", r).on("error", j).connect({
    host: "167.86.106.140",
    username: "root",
    password,
    readyTimeout: 45000,
  }),
);

console.log("Uploading phone patches…");
for (const rel of files) {
  await upload(conn, join(root, rel), `/root/service-time/${rel}`);
  console.log("ok", rel);
}

// Force WHATSAPP_NUMBER on VPS
const patchEnv = `#!/bin/bash
set -euo pipefail
cd /root/service-time
python3 - <<'PY'
from pathlib import Path
p = Path(".env")
text = p.read_text(encoding="utf-8")
phone = "+966583814214"
display = "+966 58 381 4214"
lines = []
seen = False
for line in text.splitlines():
    if line.startswith("WHATSAPP_NUMBER="):
        lines.append(f"WHATSAPP_NUMBER={phone}")
        seen = True
    elif line.startswith("NEXT_PUBLIC_APP_URL="):
        lines.append("NEXT_PUBLIC_APP_URL=https://servicetime.com.sa")
    elif line.startswith("AUTH_COOKIE_SECURE="):
        lines.append("AUTH_COOKIE_SECURE=true")
    else:
        lines.append(line)
if not seen:
    lines.append(f"WHATSAPP_NUMBER={phone}")
p.write_text("\\n".join(lines).rstrip() + "\\n", encoding="utf-8")
print("WHATSAPP_NUMBER set")
PY
npm run sync-env
NODE_OPTIONS=--max-old-space-size=1536 npm run build:web
pm2 restart service-time --update-env
sleep 3
curl -sS https://servicetime.com.sa/ | grep -o '+966[^<"]*' | head -5 || true
curl -sS https://servicetime.com.sa/contact | grep -o '+966[^<"]*' | head -5 || true
echo DONE
`;

await writeRemote(conn, "/root/patch-phone.sh", patchEnv);
try {
  await exec(conn, "bash /root/patch-phone.sh; rm -f /root/patch-phone.sh");
} finally {
  conn.end();
}
console.log("Done.");
