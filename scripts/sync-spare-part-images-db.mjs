#!/usr/bin/env node
import pg from "pg";
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();
await client.query(`
  UPDATE public.spare_parts
  SET images = jsonb_build_array(img)
  WHERE img IS NOT NULL
    AND trim(img) <> ''
    AND (images = '[]'::jsonb OR images IS NULL)
`);
const result = await client.query(
  "select name_en, img, images from public.spare_parts order by name_en",
);
for (const row of result.rows) {
  console.log(`${row.name_en}: ${JSON.stringify(row.images)}`);
}
await client.end();
console.log("✓ images column synced");
