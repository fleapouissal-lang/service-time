import type { SupabaseClient } from "@supabase/supabase-js";
import { isSyntheticLoginEmail } from "@/lib/quick-request-client";
import { removeQuickRequestPhoto } from "@/lib/quick-request-photo";
import { normalizePhone } from "@/lib/whatsapp-utils";

const REQUEST_PHOTOS_BUCKET = "request-photos";

async function deleteServiceRequestPhotos(
  admin: SupabaseClient,
  requestIds: string[],
): Promise<void> {
  if (requestIds.length === 0) return;

  const { data: photos } = await admin
    .from("request_photos")
    .select("storage_path")
    .in("request_id", requestIds);

  const paths = (photos ?? [])
    .map((row) => row.storage_path)
    .filter((path): path is string => Boolean(path));

  if (paths.length > 0) {
    const { error } = await admin.storage.from(REQUEST_PHOTOS_BUCKET).remove(paths);
    if (error) {
      console.error("[delete-client] request photos storage:", error.message);
    }
  }
}

async function deleteQuickRequestsForClient(
  admin: SupabaseClient,
  clientId: string,
  phone: string | null,
  email: string | null,
): Promise<void> {
  const filters: string[] = [`client_id.eq.${clientId}`];

  const normalizedPhone = phone?.trim() ? normalizePhone(phone) : null;
  if (normalizedPhone) {
    filters.push(`phone.eq.${normalizedPhone}`);
  }

  const normalizedEmail = email?.trim().toLowerCase() ?? null;
  if (normalizedEmail && !isSyntheticLoginEmail(normalizedEmail)) {
    filters.push(`email.eq.${normalizedEmail}`);
  }

  const { data: rows, error: fetchError } = await admin
    .from("quick_requests")
    .select("id, photo_storage_path")
    .or(filters.join(","));

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!rows?.length) return;

  for (const row of rows) {
    if (row.photo_storage_path) {
      await removeQuickRequestPhoto(row.photo_storage_path);
    }
  }

  const { error: deleteError } = await admin
    .from("quick_requests")
    .delete()
    .in(
      "id",
      rows.map((row) => row.id),
    );

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

async function deleteServiceRequestsForClient(
  admin: SupabaseClient,
  clientId: string,
  phone: string | null,
): Promise<void> {
  const filters: string[] = [`client_id.eq.${clientId}`];

  const normalizedPhone = phone?.trim() ? normalizePhone(phone) : null;
  if (normalizedPhone) {
    filters.push(`customer_phone.eq.${normalizedPhone}`);
  }

  const { data: rows, error: fetchError } = await admin
    .from("service_requests")
    .select("id")
    .or(filters.join(","));

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!rows?.length) return;

  const requestIds = rows.map((row) => row.id);
  await deleteServiceRequestPhotos(admin, requestIds);

  const { error: deleteError } = await admin
    .from("service_requests")
    .delete()
    .in("id", requestIds);

  if (deleteError) {
    throw new Error(deleteError.message);
  }
}

/** Supprime commandes / demandes liées avant suppression du compte client. */
export async function deleteClientRelatedData(
  admin: SupabaseClient,
  clientId: string,
  phone: string | null,
  email: string | null,
): Promise<void> {
  await deleteQuickRequestsForClient(admin, clientId, phone, email);
  await deleteServiceRequestsForClient(admin, clientId, phone);
}
