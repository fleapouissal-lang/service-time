#!/usr/bin/env node
/**
 * Applique le schéma Supabase via connexion Postgres directe.
 *
 * Prérequis dans .env (racine du monorepo) :
 *   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
 *
 * Usage :
 *   npm run db:migrate
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

dotenv.config({ path: join(rootDir, ".env") });

const DATABASE_URL =
  process.env.DATABASE_URL ?? process.env.SUPABASE_DB_URL ?? "";

if (!DATABASE_URL) {
  console.error(
    "❌ DATABASE_URL (ou SUPABASE_DB_URL) manquant dans .env\n" +
      "   Trouvez-le dans Supabase → Project Settings → Database → Connection string (URI)",
  );
  process.exit(1);
}

const migrationPath = join(
  rootDir,
  "supabase",
  "migrations",
  "20260603150000_initial_schema.sql",
);

const sql = readFileSync(migrationPath, "utf8");

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("🔌 Connexion à Supabase Postgres...");
  await client.connect();

  console.log("📦 Application de la migration initiale...");
  await client.query(sql);

  console.log("✅ Schéma Service Time créé avec succès.");
  console.log("   Tables : profiles, services, spare_parts, service_requests,");
  console.log("            request_photos, request_status_history,");
  console.log("            technician_locations, site_content, notifications_log");
} catch (error) {
  console.error("❌ Erreur migration :", error.message);
  process.exit(1);
} finally {
  await client.end();
}
