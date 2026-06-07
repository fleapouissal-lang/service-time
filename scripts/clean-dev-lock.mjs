import { readFileSync, unlinkSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lockPath = join(root, "apps", "web", ".next", "dev", "lock");

function isProcessRunning(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

if (!existsSync(lockPath)) {
  process.exit(0);
}

const lock = JSON.parse(readFileSync(lockPath, "utf8"));
const { pid, port, appUrl } = lock;

if (isProcessRunning(pid)) {
  console.log(`\n⚠️  Next.js tourne déjà (PID ${pid}) → ${appUrl ?? `http://localhost:${port}`}`);
  console.log(`   Arrête-le avec : taskkill /PID ${pid} /F\n`);
  process.exit(0);
}

unlinkSync(lockPath);
console.log("✓ Verrou Next.js obsolète supprimé.");
