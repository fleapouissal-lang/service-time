import { ensureServerEnv } from "@/lib/env-server";
import {
  extensionForMime,
  validateImageUpload,
} from "@/lib/image-upload-validation";
import { QUICK_REQUEST_PHOTO_BUCKET } from "@/lib/quick-request-photo";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

const MAX_BYTES = 5 * 1024 * 1024;

export function isQuickRequestPhotoBucketMissingError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("bucket not found") ||
    normalized.includes("quick-request-photos manquant")
  );
}

export async function uploadQuickRequestPhoto(
  quickRequestId: string,
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
    return { error: "إعدادات التخزين غير مكتملة (SUPABASE_SERVICE_ROLE_KEY)." };
  }

  const mime = validated.mime;
  const storagePath = `${quickRequestId}/${crypto.randomUUID()}.${extensionForMime(mime)}`;

  const { error: uploadError } = await admin.storage
    .from(QUICK_REQUEST_PHOTO_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mime,
      upsert: false,
    });

  if (uploadError) {
    if (isQuickRequestPhotoBucketMissingError(uploadError.message)) {
      return {
        error:
          "Bucket quick-request-photos manquant. Exécutez la migration 20260701120000_quick_request_photos_bucket.sql ou node scripts/apply-quick-requests.mjs",
      };
    }
    return { error: `Storage: ${uploadError.message}` };
  }

  return { storagePath };
}
