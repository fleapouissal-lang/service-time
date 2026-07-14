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

const email = "servicetime10@gmail.com";
const { error } = await admin.from("site_content").upsert(
  {
    key: "contact.email",
    value: { value: email, label_ar: "البريد" },
    updated_at: new Date().toISOString(),
  },
  { onConflict: "key" },
);
console.log("contact.email", error ? error.message : "ok");
