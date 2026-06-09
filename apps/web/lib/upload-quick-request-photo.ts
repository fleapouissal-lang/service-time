import { ensureServerEnv } from "@/lib/env-server";
import { QUICK_REQUEST_PHOTO_BUCKET } from "@/lib/quick-request-photo";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { createWebSupabaseClient } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

function extensionForMime(mime: string): string {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  return "webp";
}

function resolveMimeType(file: File): string | null {
  if (ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return file.type;
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
  };
  return map[ext] ?? null;
}

export async function uploadQuickRequestPhoto(
  quickRequestId: string,
  file: File,
): Promise<{ storagePath: string } | { error: string }> {
  ensureServerEnv();

  const mime = resolveMimeType(file);
  if (!mime) {
    return { error: "نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "حجم الصورة يجب أن لا يتجاوز 5 MB." };
  }

  const admin = getAdminSupabaseClient();
  const supabase = admin ?? createWebSupabaseClient();
  const storagePath = `${quickRequestId}/${crypto.randomUUID()}.${extensionForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(QUICK_REQUEST_PHOTO_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Storage: ${uploadError.message}` };
  }

  return { storagePath };
}
