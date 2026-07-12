#!/usr/bin/env node
/**
 * Vide les caches Next.js / Turbopack du monorepo (sans rebuild).
 * Usage (cron) : node scripts/clear-web-cache.mjs
 */
import { rmSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const targets = [
  join(root, "apps", "web", ".next", "cache"),
  join(root, ".turbo"),
  join(root, "node_modules", ".cache"),
  join(root, "apps", "web", "node_modules", ".cache"),
];

let cleared = 0;
for (const target of targets) {
  if (!existsSync(target)) continue;
  rmSync(target, { recursive: true, force: true });
  console.log(`[cache] cleared ${target}`);
  cleared += 1;
}

console.log(`[cache] done (${cleared} path(s)) ${new Date().toISOString()}`);
