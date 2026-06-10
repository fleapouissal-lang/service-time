/** Applique admin_read_at sur quick_requests */
import pg from "pg";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import "dotenv/config";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const databaseUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.SUPABASE_DB_URL?.trim() ||
  process.env.DIRECT_URL?.trim();

if (!databaseUrl) {
  console.error("❌ DATABASE_URL (ou SUPABASE_DB_URL) requis dans .env");
  process.exit(1);
}

const sql = readFileSync(
  join(root, "supabase/migrations/20260702120000_quick_requests_admin_read_at.sql"),
  "utf8",
);

const client = new pg.Client({ connectionString: databaseUrl });

try {
  await client.connect();
  await client.query(sql);
  console.log("✅ Colonne admin_read_at appliquée sur quick_requests.");
} catch (error) {
  console.error("❌ Échec migration quick_requests admin_read_at:", error);
  process.exit(1);
} finally {
  await client.end();
}
