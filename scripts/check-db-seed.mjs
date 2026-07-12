#!/usr/bin/env node
import pg from "pg";
import dotenv from "dotenv";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const tables = [
  "services",
  "spare_parts",
  "service_requests",
  "site_content",
  "profiles",
  "spare_part_orders",
];

for (const table of tables) {
  const result = await client.query(
    `select count(*)::int as n from public.${table}`,
  );
  console.log(`${table}: ${result.rows[0].n}`);
}

const buckets = await client.query(
  "select id, public from storage.buckets order by id",
);
console.log(
  "buckets:",
  buckets.rows.map((row) => `${row.id}${row.public ? " (public)" : ""}`).join(", "),
);

const imgs = await client.query(
  "select name_ar, img from public.spare_parts order by name_ar",
);
console.log("spare_parts images:");
for (const row of imgs.rows) {
  console.log(` - ${row.name_ar} => ${row.img}`);
}

const objects = await client.query(
  "select bucket_id, count(*)::int as n from storage.objects group by bucket_id order by bucket_id",
);
console.log(
  "storage objects:",
  objects.rows.length ? objects.rows : "none (buckets empty)",
);

await client.end();
