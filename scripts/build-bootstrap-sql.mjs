#!/usr/bin/env node
/**
 * Concatène toutes les migrations SQL pour bootstrap d'un nouveau projet Supabase.
 * Usage : node scripts/build-bootstrap-sql.mjs
 * Puis coller supabase/bootstrap_new_project.sql dans Supabase → SQL Editor → Run
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");
const outPath = join(root, "supabase", "bootstrap_new_project.sql");

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

const parts = [
  "-- Service Time — bootstrap complet pour nouveau projet Supabase",
  "-- Généré automatiquement — ne pas éditer à la main",
  "BEGIN;",
  "",
];

for (const file of files) {
  parts.push(`-- ===== ${file} =====`);
  parts.push(readFileSync(join(migrationsDir, file), "utf8").trim());
  parts.push("");
}

parts.push(`
CREATE TABLE IF NOT EXISTS service_time_schema_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
`);

for (const file of files) {
  parts.push(
    `INSERT INTO service_time_schema_migrations (filename) VALUES ('${file}') ON CONFLICT DO NOTHING;`,
  );
}

parts.push("COMMIT;", "");

writeFileSync(outPath, parts.join("\n"), "utf8");
console.log(`✓ ${outPath}`);
console.log(`  ${files.length} migrations`);
