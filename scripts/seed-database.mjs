#!/usr/bin/env node
/**
 * Insère les données de démo Service Time.
 *
 * Prérequis dans .env :
 *   DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
 *
 * Usage : npm run db:seed
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
    "❌ DATABASE_URL manquant dans .env\n" +
      "   Supabase → Project Settings → Database → Connection string (URI)",
  );
  process.exit(1);
}

const seedPath = join(rootDir, "supabase", "seed.sql");
const sql = readFileSync(seedPath, "utf8");

const client = new pg.Client({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  console.log("🔌 Connexion à Supabase Postgres...");
  await client.connect();

  console.log("🌱 Insertion des données seed...");
  await client.query(sql);

  console.log("✅ Seed terminé.");
  console.log("   • 6 services");
  console.log("   • 5 pièces détachées");
  console.log("   • 3 demandes démo");
  console.log("   • Contenu CMS (hero, contact, ateliers)");
  console.log("");
  console.log("   Token suivi live : demo-track-live");
} catch (error) {
  console.error("❌ Erreur seed :", error.message);
  process.exit(1);
} finally {
  await client.end();
}
