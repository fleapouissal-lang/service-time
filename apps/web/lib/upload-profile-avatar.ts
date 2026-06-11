import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureServerEnv } from "@/lib/env-server";
import {
  extensionForMime,
  validateImageUpload,
} from "@/lib/image-upload-validation";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

const MAX_BYTES = 5 * 1024 * 1024;

export function getAvatarFromFormData(formData: FormData): File | null {
  const value = formData.get("avatar");
  if (value instanceof File && value.size > 0) return value;
  return null;
}

export function getProfileAvatarPublicUrl(
  supabase: SupabaseClient,
  storagePath: string,
): string {
  const { data } = supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .getPublicUrl(storagePath);
  return data.publicUrl;
}

export async function uploadProfileAvatar(
  userId: string,
  file: File,
): Promise<{ storagePath: string; publicUrl: string } | { error: string }> {
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

  const mime = validated.mime;
  const storagePath = `${userId}/avatar.${extensionForMime(mime)}`;

  const { error: uploadError } = await admin.storage
    .from(PROFILE_AVATAR_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: true,
    });

  if (uploadError) {
    return { error: `Storage: ${uploadError.message}` };
  }

  return {
    storagePath,
    publicUrl: getProfileAvatarPublicUrl(admin, storagePath),
  };
}
