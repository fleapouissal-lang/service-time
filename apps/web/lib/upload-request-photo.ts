import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureServerEnv } from "@/lib/env-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { createWebSupabaseClient } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const MAX_BYTES = 5 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

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
  const fromExt = EXT_TO_MIME[ext];
  if (fromExt) return fromExt;

  return null;
}

export function getPhotoFromFormData(formData: FormData): File | null {
  const value = formData.get("photo");
  if (value instanceof File && value.size > 0) return value;
  return null;
}

export function formHasPhotoField(formData: FormData): boolean {
  const value = formData.get("photo");
  return value instanceof File && value.size > 0;
}

async function savePhotoRecord(
  supabase: SupabaseClient,
  requestId: string,
  storagePath: string,
  useAdmin: boolean,
): Promise<{ error?: string }> {
  if (useAdmin) {
    const { error } = await supabase.from("request_photos").insert({
      request_id: requestId,
      storage_path: storagePath,
    });
    return error ? { error: error.message } : {};
  }

  const { error } = await supabase.rpc("attach_request_photo", {
    p_request_id: requestId,
    p_storage_path: storagePath,
  });
  return error ? { error: error.message } : {};
}

export async function uploadRequestPhoto(
  requestId: string,
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
  const useAdmin = admin !== null;

  const storagePath = `${requestId}/${crypto.randomUUID()}.${extensionForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from("request-photos")
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    return { error: `Storage: ${uploadError.message}` };
  }

  const dbResult = await savePhotoRecord(
    supabase,
    requestId,
    storagePath,
    useAdmin,
  );

  if (dbResult.error) {
    await supabase.storage.from("request-photos").remove([storagePath]);
    return { error: `Database: ${dbResult.error}` };
  }

  return { storagePath };
}
