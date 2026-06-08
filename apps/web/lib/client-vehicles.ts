import type { ClientVehicle } from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export async function getClientVehicles(
  clientId: string,
): Promise<ClientVehicle[]> {
  const supabase = await createAuthServerClient();
  const { data, error } = await supabase
    .from("client_vehicles")
    .select("*")
    .eq("client_id", clientId)
    .order("label", { ascending: true });

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
    .order("label", { ascending: true });

  if (error) return [];
  return (data ?? []) as ClientVehicle[];
}

export async function saveClientVehicle(
  clientId: string,
  label: string,
): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;

  const supabase = await createAuthServerClient();
  const { data: existing } = await supabase
    .from("client_vehicles")
    .select("id, label")
    .eq("client_id", clientId);

  const duplicate = (existing ?? []).some(
    (row) => row.label.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) return;

  await supabase.from("client_vehicles").insert({
    client_id: clientId,
    label: trimmed,
  });
}

export async function saveClientVehicleAsAdmin(
  clientId: string,
  label: string,
): Promise<void> {
  const trimmed = label.trim();
  if (!trimmed) return;

  const admin = getAdminSupabaseClient();
  if (!admin) return;

  const { data: existing } = await admin
    .from("client_vehicles")
    .select("id, label")
    .eq("client_id", clientId);

  const duplicate = (existing ?? []).some(
    (row) => row.label.trim().toLowerCase() === trimmed.toLowerCase(),
  );
  if (duplicate) return;

  await admin.from("client_vehicles").insert({
    client_id: clientId,
    label: trimmed,
  });
}
