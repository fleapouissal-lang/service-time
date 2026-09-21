#!/usr/bin/env node
import dotenv from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
);

const { data, error } = await supabase
  .from("spare_parts")
  .select("name_en, img, images, stock_quantity, is_active")
  .eq("is_active", true)
  .gt("stock_quantity", 0)
  .limit(5);

if (error) {
  console.error("error", error.message);
  process.exit(1);
}

console.log(JSON.stringify(data, null, 2));
