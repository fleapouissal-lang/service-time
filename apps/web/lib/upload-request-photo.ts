import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureServerEnv } from "@/lib/env-server";
import {
  extensionForMime,
  validateImageUpload,
} from "@/lib/image-upload-validation";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

const MAX_BYTES = 5 * 1024 * 1024;

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

  if (file.size > MAX_BYTES) {
    return { error: "حجم الصورة يجب أن لا يتجاوز 5 MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const validated = validateImageUpload(file, buffer);
  if ("error" in validated) {
    return { error: validated.error };
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { error: "إعدادات التخزين غير مكتملة." };
  }

  const supabase = admin;
  const useAdmin = true;
  const mime = validated.mime;

  const storagePath = `${requestId}/${crypto.randomUUID()}.${extensionForMime(mime)}`;

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
