#!/usr/bin/env node
import { Client } from "ssh2";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const password = process.env.DEPLOY_SSH_PASSWORD;
if (!password) process.exit(1);

const conf = readFileSync(join(root, "scripts/nginx-service-time.conf"), "utf8");

const cmd = `#!/bin/bash
set -euo pipefail

# Keep SSL certbot config: patch buffers into live site instead of overwriting SSL
SITE=/etc/nginx/sites-available/service-time
if [ ! -f "$SITE" ]; then
  cp /root/nginx-service-time.conf "$SITE"
fi

# Ensure buffer directives exist in the location / block
python3 - <<'PY'
from pathlib import Path
p = Path("/etc/nginx/sites-available/service-time")
text = p.read_text(encoding="utf-8")
needles = [
    ("proxy_buffer_size 128k;", "        proxy_buffer_size 128k;"),
    ("proxy_buffers 8 256k;", "        proxy_buffers 8 256k;"),
    ("proxy_busy_buffers_size 256k;", "        proxy_busy_buffers_size 256k;"),
    ("proxy_temp_file_write_size 256k;", "        proxy_temp_file_write_size 256k;"),
    ("large_client_header_buffers 8 64k;", "    large_client_header_buffers 8 64k;"),
]
changed = False
for key, line in needles:
    if key not in text:
        if key.startswith("large_client"):
            text = text.replace("server_name", line + "\\n    server_name", 1)
        else:
            text = text.replace("proxy_cache_bypass", line + "\\n        proxy_cache_bypass", 1)
        changed = True
        print("added", key)
    else:
        print("have", key)
if changed:
    p.write_text(text, encoding="utf-8")
print("---")
print(p.read_text(encoding="utf-8")[:1200])
PY

nginx -t
systemctl reload nginx
echo RELOADED

# Sanity: wrong password still 401
curl -sS -o /tmp/a.json -w "wrong=%{http_code}\\n" -X POST https://servicetime.com.sa/api/auth/login \\
  -H 'content-type: application/json' -d '{"identifier":"ouissalbenzahi@gmail.com","password":"wrong"}'
cat /tmp/a.json; echo
`;

const conn = new Client();
await new Promise((r, j) =>
  conn.on("ready", r).on("error", j).connect({
    host: "167.86.106.140",
    username: "root",
    password,
    readyTimeout: 45000,
  }),
);

await new Promise((r, j) => {
  conn.sftp((e, sftp) => {
    if (e) return j(e);
    const ws = sftp.createWriteStream("/root/nginx-service-time.conf");
    ws.on("close", r);
    ws.on("error", j);
    ws.end(conf.replace(/\r\n/g, "\n"));
  });
});

await new Promise((r, j) => {
  conn.sftp((e, sftp) => {
    if (e) return j(e);
    const ws = sftp.createWriteStream("/root/fix-nginx-buffers.sh");
    ws.on("close", r);
    ws.on("error", j);
    ws.end(cmd);
  });
});

await new Promise((r, j) => {
  conn.exec("bash /root/fix-nginx-buffers.sh; rm -f /root/fix-nginx-buffers.sh /root/nginx-service-time.conf", (e, stream) => {
    if (e) return j(e);
    stream.on("data", (d) => process.stdout.write(d));
    stream.stderr.on("data", (d) => process.stderr.write(d));
    stream.on("close", (c) => (c === 0 ? r() : j(new Error("exit " + c))));
  });
});
conn.end();
console.log("Done.");
