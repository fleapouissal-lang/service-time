#!/usr/bin/env node
/**
 * Applique les migrations SQL Supabase via connexion Postgres.
 *
 * Prérequis dans .env (racine du monorepo) :
 *   DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
 *
 * Sur Windows, préférer le pooler Session (IPv4) — db.[PROJECT_REF].supabase.co
 * ne résout souvent qu'en IPv6 et provoque ENOTFOUND.
 *
 * Usage :
 *   npm run db:migrate
 */

import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");
const migrationsDir = join(rootDir, "supabase", "migrations");

dotenv.config({ path: join(rootDir, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

if (!DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL (ou SUPABASE_DB_URL) manquant dans .env\n" +
      "   Supabase → Project Settings → Database → Connection string (Session pooler, URI)",
  );
  process.exit(1);
}

function invalidUrlHint(error) {
  if (error?.code !== "ERR_INVALID_URL") return "";
  return (
    "\n\n💡 DATABASE_URL invalide : ne mettez pas de crochets [] autour du mot de passe.\n" +
    "   Encodez les caractères spéciaux (+ ? % / @ #) en URL.\n" +
    "   Exemple : +fw?Cw%+LV7RdQ/ → %2Bfw%3FCw%25%2BLV7RdQ%2F\n" +
    "   Copiez l'URI complète depuis Supabase Dashboard (Session pooler, port 5432)."
  );
}

function migrationHint(error) {
  const msg = error?.message ?? "";
  if (!msg.includes("ENOTFOUND") && !msg.includes("EAI_AGAIN")) return "";

  if (/db\.[a-z0-9]+\.supabase\.co/i.test(DATABASE_URL)) {
    return (
      "\n\n💡 Le host direct db.*.supabase.co ne résout souvent qu'en IPv6 sur Windows.\n" +
      "   Remplacez DATABASE_URL par la chaîne « Session pooler » (port 5432) du dashboard Supabase.\n" +
      "   Exemple : postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
    );
  }
  return "";
}

function listMigrationFiles() {
  return readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
}

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("🔌 Connexion à Supabase Postgres...");
  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS service_time_schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  const { rows: appliedRows } = await client.query(
    "SELECT filename FROM service_time_schema_migrations",
  );
  const applied = new Set(appliedRows.map((row) => row.filename));

  const files = listMigrationFiles();
  const pending = files.filter((file) => !applied.has(file));

  if (pending.length === 0) {
    console.log("✅ Aucune migration en attente (" + files.length + " déjà appliquées).");
    process.exit(0);
  }

  console.log("📦 " + pending.length + " migration(s) à appliquer...");

  for (const file of pending) {
    const sql = readFileSync(join(migrationsDir, file), "utf8");
    console.log("   → " + file);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        "INSERT INTO service_time_schema_migrations (filename) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  }

  console.log("✅ Migrations appliquées avec succès (" + pending.length + ").");
} catch (error) {
  console.error("❌ Erreur migration :", error.message);
  console.error(invalidUrlHint(error));
  console.error(migrationHint(error));
  process.exit(1);
} finally {
  await client.end();
}
