#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envText = readFileSync(join(root, ".env"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^"|"$/g, "") : "";
}

const admin = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false } },
);

const phone = "+966 58 381 4214";
const rows = [
  { key: "contact.phone", value: { value: phone, label_ar: "الهاتف" } },
  { key: "contact.whatsapp", value: { value: phone, label_ar: "واتساب" } },
];

for (const row of rows) {
  const { error } = await admin.from("site_content").upsert(
    { ...row, updated_at: new Date().toISOString() },
    { onConflict: "key" },
  );
  console.log(row.key, error ? error.message : "ok");
}

const { data } = await admin
  .from("site_content")
  .select("key,value")
  .in("key", ["contact.phone", "contact.whatsapp"]);
console.log(JSON.stringify(data, null, 2));
