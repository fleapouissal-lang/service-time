#!/usr/bin/env node
/**
 * Vérifie et ajoute la valeur "assigned" à l'enum request_status.
 *
 * Usage :
 *   npm run db:request-status-assigned
 *   node scripts/apply-request-status-assigned.mjs --check
 *
 * Si DATABASE_URL manque, copiez le SQL de :
 *   supabase/migrations/20260703120000_request_status_assigned.sql
 * dans Supabase → SQL Editor.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const migrationFile = "20260703120000_request_status_assigned.sql";
const checkOnly = process.argv.includes("--check");

dotenv.config({ path: join(rootDir, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

async function listRequestStatusValues(client) {
  const { rows } = await client.query(`
    SELECT e.enumlabel AS value
    FROM pg_enum e
    INNER JOIN pg_type t ON e.enumtypid = t.oid
    INNER JOIN pg_namespace n ON t.typnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.typname = 'request_status'
    ORDER BY e.enumsortorder
  `);
  return rows.map((row) => row.value);
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS service_time_schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

async function markMigrationApplied(client) {
  await ensureMigrationsTable(client);
  await client.query(
    `INSERT INTO service_time_schema_migrations (filename)
     VALUES ($1)
     ON CONFLICT (filename) DO NOTHING`,
    [migrationFile],
  );
}

async function main() {
  if (!DATABASE_URL) {
    console.error(
      "❌ DATABASE_URL manquant dans .env\n" +
        "   Exécutez le SQL manuellement dans Supabase SQL Editor :\n" +
        `   supabase/migrations/${migrationFile}`,
    );
    process.exit(1);
  }

  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    const values = await listRequestStatusValues(client);

    console.log("request_status enum values:", values.join(", ") || "(introuvable)");

    if (values.includes("assigned")) {
      console.log('✅ "assigned" est déjà présent.');
      await markMigrationApplied(client);
      return;
    }

    if (checkOnly) {
      console.error('❌ "assigned" manque — lancez : npm run db:request-status-assigned');
      process.exit(1);
    }

    const sqlPath = join(rootDir, "supabase", "migrations", migrationFile);
    const sql = readFileSync(sqlPath, "utf8");
    console.log(`→ Application de ${migrationFile}...`);
    await client.query(sql);

    const after = await listRequestStatusValues(client);
    if (!after.includes("assigned")) {
      throw new Error('"assigned" n\'a pas pu être ajouté à request_status.');
    }

    await markMigrationApplied(client);
    console.log('✅ "assigned" ajouté à request_status.');
    console.log("Valeurs finales:", after.join(", "));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("❌", error.message);
  process.exit(1);
});
