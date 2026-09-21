#!/usr/bin/env node
import { Client } from "ssh2";

const password = process.env.DEPLOY_SSH_PASSWORD;
if (!password) process.exit(1);

const cmd = `#!/bin/bash
cd /root/service-time
echo "=== DIRECT :3000 LOGIN ==="
curl -sS -o /tmp/l1.json -w "code=%{http_code} time=%{time_total}\\n" --connect-timeout 20 \\
  -X POST http://127.0.0.1:3000/api/auth/login \\
  -H 'content-type: application/json' \\
  -d '{"identifier":"ouissalbenzahi@gmail.com","password":"x"}'
echo -n "body="; head -c 800 /tmp/l1.json; echo

echo "=== VIA NGINX LOGIN ==="
curl -sS -o /tmp/l2.json -w "code=%{http_code} time=%{time_total}\\n" --connect-timeout 20 \\
  -X POST https://servicetime.com.sa/api/auth/login \\
  -H 'content-type: application/json' \\
  -H 'origin: https://servicetime.com.sa' \\
  -d '{"identifier":"ouissalbenzahi@gmail.com","password":"x"}'
echo -n "body="; head -c 800 /tmp/l2.json; echo

echo "=== NGINX ERR ==="
tail -30 /var/log/nginx/error.log 2>/dev/null || true

echo "=== PM2 STATUS ==="
pm2 describe service-time | head -25

echo "=== RECENT OUT/ERR ==="
pm2 logs service-time --lines 50 --nostream | tail -60

echo "=== ENV KEYS PRESENT ==="
node -e "
require('dotenv').config({path:'.env'});
const keys=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL'];
for (const k of keys) console.log(k, process.env[k] ? 'SET '+process.env[k].length : 'MISSING');
" 2>/dev/null || python3 - <<'PY'
from pathlib import Path
text=Path('.env').read_text()
for k in ['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','DATABASE_URL']:
    for line in text.splitlines():
        if line.startswith(k+'='):
            v=line.split('=',1)[1]
            print(k, 'SET', len(v) if v else 0)
            break
    else:
        print(k, 'MISSING')
PY
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
    const ws = sftp.createWriteStream("/root/check-login2.sh");
    ws.on("close", r);
    ws.on("error", j);
    ws.end(cmd);
  });
});

await new Promise((r, j) => {
  conn.exec("bash /root/check-login2.sh; rm -f /root/check-login2.sh", (e, stream) => {
    if (e) return j(e);
    stream.on("data", (d) => process.stdout.write(d));
    stream.stderr.on("data", (d) => process.stderr.write(d));
    stream.on("close", (c) => (c === 0 ? r() : j(new Error("exit " + c))));
  });
});
conn.end();
