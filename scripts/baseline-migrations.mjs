#!/usr/bin/env node
/** Marque les migrations comme déjà appliquées sans exécuter le SQL (base existante). */
import dotenv from "dotenv";
import pg from "pg";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const migrationsDir = join(root, "supabase", "migrations");

dotenv.config({ path: join(root, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

const until = process.argv[2];
if (!until) {
  console.error(
    "Usage: node scripts/baseline-migrations.mjs <filename.sql>\n" +
      "Exemple: node scripts/baseline-migrations.mjs 20260622130000_profile_localized_names.sql",
  );
  process.exit(1);
}

const files = readdirSync(migrationsDir)
  .filter((name) => name.endsWith(".sql"))
  .sort();

if (!files.includes(until)) {
  console.error("Migration introuvable:", until);
  process.exit(1);
}

const toMark = files.slice(0, files.indexOf(until) + 1);

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`
  CREATE TABLE IF NOT EXISTS service_time_schema_migrations (
    filename text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
  )
`);

for (const file of toMark) {
  await client.query(
    `INSERT INTO service_time_schema_migrations (filename)
     VALUES ($1)
     ON CONFLICT (filename) DO NOTHING`,
    [file],
  );
}

console.log("✅ Baseline:", toMark.length, "migration(s) marquée(s) jusqu'à", until);
await client.end();
