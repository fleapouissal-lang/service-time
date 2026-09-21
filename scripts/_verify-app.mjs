import { readFileSync } from "node:fs";
import { Client } from "ssh2";

function loadPassword() {
  if (process.env.DEPLOY_SSH_PASSWORD) return process.env.DEPLOY_SSH_PASSWORD;
  for (const file of [".env", "apps/web/.env.local"]) {
    try {
      const text = readFileSync(file, "utf8");
      const match = text.match(/^DEPLOY_SSH_PASSWORD=(.*)$/m);
      if (match) return match[1].trim().replace(/^["']|["']$/g, "");
    } catch {
      // optional
    }
  }
  const src = readFileSync("scripts/patch-email-vps.mjs", "utf8");
  const match = src.match(/DEPLOY_SSH_PASSWORD \|\| "([^"]+)"/);
  return match?.[1] ?? "";
}

const password = loadPassword();
if (!password) {
  console.error("DEPLOY_SSH_PASSWORD missing");
  process.exit(1);
}

const cmd = `echo '=== HEAD ==='; cd /root/service-time && git log -1 --oneline; echo '=== PM2 ==='; pm2 jlist | python3 -c "import sys,json; d=json.load(sys.stdin); p=[x for x in d if x.get('name')=='service-time'][0]; print('status', p['pm2_env']['status']); print('uptime_ms', p['pm2_env'].get('pm_uptime')); print('restarts', p['pm2_env'].get('restart_time'))"; echo '=== RECENT ERR ==='; pm2 logs service-time --err --lines 60 --nostream --raw 2>/dev/null | tail -80; echo '=== HTTP ==='; for p in / /services /spare-parts /login /request /admin /admin/services /admin/spare-parts /admin/spare-part-orders /admin/orders /admin/users /admin/locations; do code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://127.0.0.1:3000$p"); echo "$code $p"; done`;

const conn = new Client();
await new Promise((resolve, reject) => {
  conn.on("ready", resolve).on("error", reject).connect({
    host: "167.86.106.140",
    username: "root",
    password,
    readyTimeout: 45000,
  });
});

await new Promise((resolve, reject) => {
  conn.exec(cmd, (err, stream) => {
    if (err) return reject(err);
    stream.on("data", (d) => process.stdout.write(d));
    stream.stderr.on("data", (d) => process.stderr.write(d));
    stream.on("close", (code) => {
      conn.end();
      if (code === 0) resolve();
      else reject(new Error("exit " + code));
    });
  });
});
