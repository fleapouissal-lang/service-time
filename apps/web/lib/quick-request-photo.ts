import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export const QUICK_REQUEST_PHOTO_BUCKET = "quick-request-photos";

const LEGACY_BUCKET = "request-photos";

/** Anciens chemins `quick/{id}/…` étaient dans request-photos. */
export function resolveQuickRequestPhotoBucket(storagePath: string): string {
  if (storagePath.startsWith("quick/")) {
    return LEGACY_BUCKET;
  }
  return QUICK_REQUEST_PHOTO_BUCKET;
}

export async function getQuickRequestPhotoSignedUrl(
  storagePath: string,
  expiresIn = 3600,
): Promise<string | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const bucket = resolveQuickRequestPhotoBucket(storagePath);
  const { data, error } = await admin.storage
    .from(bucket)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    console.error("[quick-request-photo] signed url:", error?.message);
    return null;
  }

  return data.signedUrl;
}

export async function removeQuickRequestPhoto(storagePath: string): Promise<void> {
  const admin = getAdminSupabaseClient();
  if (!admin) return;

  const bucket = resolveQuickRequestPhotoBucket(storagePath);
  const { error } = await admin.storage.from(bucket).remove([storagePath]);

  if (error) {
    console.error("[quick-request-photo] remove:", error.message);
  }
}
