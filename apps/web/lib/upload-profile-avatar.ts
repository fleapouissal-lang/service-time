import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureServerEnv } from "@/lib/env-server";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const PROFILE_AVATAR_BUCKET = "profile-avatars";

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
  return EXT_TO_MIME[ext] ?? null;
}

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

  const mime = resolveMimeType(file);
  if (!mime) {
    return { error: "نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP." };
  }

  if (file.size > MAX_BYTES) {
    return { error: "حجم الصورة يجب أن لا يتجاوز 5 MB." };
  }

  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { error: "إعدادات التخزين غير مكتملة." };
  }

  const storagePath = `${userId}/avatar.${extensionForMime(mime)}`;
  const buffer = Buffer.from(await file.arrayBuffer());

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
