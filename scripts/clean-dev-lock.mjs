import { readFileSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, "apps", "web", ".next", "dev", "lock");
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

function isProcessRunning(pid) {
  if (!pid || !Number.isFinite(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function getPidsListeningOnPort(port) {
  if (process.platform === "win32") {
    try {
      const out = execSync(`netstat -ano -p tcp`, { encoding: "utf8" });
      const pids = new Set();
      for (const line of out.split(/\r?\n/)) {
        if (!line.includes("LISTENING")) continue;
        const parts = line.trim().split(/\s+/);
        const local = parts[1] ?? "";
        const pid = Number(parts[parts.length - 1]);
        if (!Number.isFinite(pid) || pid <= 0) continue;
        if (
          local.endsWith(`:${port}`) ||
          local === `[::]:${port}` ||
          local === `0.0.0.0:${port}`
        ) {
          pids.add(pid);
        }
      }
      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    const out = execSync(`lsof -tiTCP:${port} -sTCP:LISTEN`, {
      encoding: "utf8",
    });
    return out
      .split(/\s+/)
      .map((v) => Number(v))
      .filter((pid) => Number.isFinite(pid) && pid > 0);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (!pid || pid === process.pid) return;
  try {
    if (process.platform === "win32") {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore" });
    } else {
      process.kill(pid, "SIGTERM");
    }
  } catch {
    // already gone
  }
}

function removeLock() {
  if (!existsSync(lockPath)) return;
  try {
    unlinkSync(lockPath);
  } catch {
    // ignore
  }
}

const lockPids = [];
if (existsSync(lockPath)) {
  try {
    const lock = JSON.parse(readFileSync(lockPath, "utf8"));
    const pid = Number(lock.pid);
    if (Number.isFinite(pid) && pid > 0) lockPids.push(pid);
  } catch {
    removeLock();
  }
}

const port = DEFAULT_PORT;
const listeningPids = getPidsListeningOnPort(port);
const pidsToKill = [...new Set([...lockPids, ...listeningPids])].filter(
  (pid) => isProcessRunning(pid),
);

if (pidsToKill.length > 0) {
  console.log(
    `⚠️  Port ${port} occupé (PID ${pidsToKill.join(", ")}) — arrêt pour redémarrer proprement…`,
  );
  for (const pid of pidsToKill) killPid(pid);
  await sleep(800);
}

removeLock();
if (pidsToKill.length > 0) {
  console.log(`✓ Port ${port} libéré.`);
}
