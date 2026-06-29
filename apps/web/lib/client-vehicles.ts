import type { ClientVehicle } from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";
import {
  buildClientVehiclePayload,
  type ClientVehicleInput,
} from "@/lib/client-vehicle-display";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

type VehicleInsertPayload = ReturnType<typeof buildClientVehiclePayload>;

async function insertClientVehicleRow(
  supabase: Awaited<ReturnType<typeof createAuthServerClient>>,
  clientId: string,
  payload: VehicleInsertPayload,
) {
  const attempts: Record<string, unknown>[] = [
    { client_id: clientId, ...payload },
    {
      client_id: clientId,
      label: payload.label,
      brand: payload.brand,
      model: payload.model,
      brand_slug: payload.brand_slug,
    },
    { client_id: clientId, label: payload.label },
  ];

  for (const row of attempts) {
    const { data, error } = await supabase
      .from("client_vehicles")
      .insert(row)
      .select("*")
      .single();

    if (!error && data) {
      return { vehicle: data as ClientVehicle, error: null };
    }

    if (error) {
      console.error("[createClientVehicle] insert failed:", error.message, row);
    }
  }

  return { vehicle: null, error: "insert_failed" as const };
}

export async function getClientVehicles(
  clientId: string,
): Promise<ClientVehicle[]> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("client_vehicles")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ClientVehicle[];
}

export async function getClientVehiclesAsAdmin(
  clientId: string,
): Promise<ClientVehicle[]> {
  const admin = getAdminSupabaseClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("client_vehicles")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []) as ClientVehicle[];
}

async function isDuplicateLabel(
  clientId: string,
  label: string,
  useAdmin: boolean,
): Promise<boolean> {
  const supabase = useAdmin
    ? getAdminSupabaseClient()
    : await createAuthServerClient();
  if (!supabase) return false;

  const { data: existing } = await supabase
    .from("client_vehicles")
    .select("id, label")
    .eq("client_id", clientId);

  return (existing ?? []).some(
    (row) => row.label.trim().toLowerCase() === label.trim().toLowerCase(),
  );
}

export async function createClientVehicle(
  clientId: string,
  input: ClientVehicleInput,
): Promise<{ vehicle: ClientVehicle | null; error?: string }> {
  const payload = buildClientVehiclePayload(input);
  if (await isDuplicateLabel(clientId, payload.label, false)) {
    return { vehicle: null, error: "duplicate" };
  }

  const supabase = await createAuthServerClient();
  const result = await insertClientVehicleRow(supabase, clientId, payload);
  if (result.error) return { vehicle: null, error: result.error };
  return { vehicle: result.vehicle };
}

export async function createClientVehicleAsAdmin(
  clientId: string,
  input: ClientVehicleInput,
): Promise<{ vehicle: ClientVehicle | null; error?: string }> {
  const payload = buildClientVehiclePayload(input);
  if (await isDuplicateLabel(clientId, payload.label, true)) {
    return { vehicle: null, error: "duplicate" };
  }

  const admin = getAdminSupabaseClient();
  if (!admin) return { vehicle: null, error: "insert_failed" };

  const attempts: Record<string, unknown>[] = [
    { client_id: clientId, ...payload },
    {
      client_id: clientId,
      label: payload.label,
      brand: payload.brand,
      model: payload.model,
      brand_slug: payload.brand_slug,
    },
    { client_id: clientId, label: payload.label },
  ];

  for (const row of attempts) {
    const { data, error } = await admin
      .from("client_vehicles")
      .insert(row)
      .select("*")
      .single();

    if (!error && data) {
      return { vehicle: data as ClientVehicle };
    }

    if (error) {
      console.error("[createClientVehicleAsAdmin] insert failed:", error.message);
    }
  }

  return { vehicle: null, error: "insert_failed" };
}

/** Legacy: save a plain label from service request forms. */
export async function saveClientVehicle(
  clientId: string,
  label: string,
): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;
  if (await isDuplicateLabel(clientId, trimmed, false)) return;

  const supabase = await createAuthServerClient();
  await supabase.from("client_vehicles").insert({
    client_id: clientId,
    label: trimmed,
    brand: trimmed,
    model: "",
    brand_slug: null,
  });
}

export async function saveClientVehicleAsAdmin(
  clientId: string,
  label: string,
): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;
  if (await isDuplicateLabel(clientId, trimmed, true)) return;

  const admin = getAdminSupabaseClient();
  if (!admin) return;

  await admin.from("client_vehicles").insert({
    client_id: clientId,
    label: trimmed,
    brand: trimmed,
    model: "",
    brand_slug: null,
  });
}

export async function deleteClientVehicle(
  clientId: string,
  vehicleId: string,
): Promise<boolean> {
  const supabase = await createAuthServerClient();
  const { error } = await supabase
    .from("client_vehicles")
    .delete()
    .eq("client_id", clientId)
    .eq("id", vehicleId);

  return !error;
}

export async function deleteClientVehicleByLabel(
  clientId: string,
  label: string,
): Promise<boolean> {
  const trimmed = label.trim();
  if (!trimmed) return false;

  const supabase = await createAuthServerClient();
  const { error } = await supabase
    .from("client_vehicles")
    .delete()
    .eq("client_id", clientId)
    .eq("label", trimmed);

  return !error;
}

export async function deleteClientVehicleAsAdmin(
  clientId: string,
  label: string,
): Promise<boolean> {
  const trimmed = label.trim();
  if (!trimmed) return false;

  const admin = getAdminSupabaseClient();
  if (!admin) return false;

  const { error } = await admin
    .from("client_vehicles")
    .delete()
    .eq("client_id", clientId)
    .eq("label", trimmed);

  return !error;
}
