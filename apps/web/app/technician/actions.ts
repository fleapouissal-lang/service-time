"use server";

import { revalidatePath } from "next/cache";
import type { ServiceRequestStatus } from "@service-time/types";
import { createAuthServerClient, requireProfile } from "@/lib/auth";

export async function updateTechnicianOrderStatus(formData: FormData) {
  const profile = await requireProfile(["technician"]);
  if (!profile) throw new Error("غير مصرح");

  const supabase = await createAuthServerClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as ServiceRequestStatus;

  const { error } = await supabase
    .from("service_requests")
    .update({ status })
    .eq("id", id)
    .eq("assigned_technician_id", profile.id);

  if (error) throw new Error(error.message);
  revalidatePath("/technician");
  revalidatePath(`/technician/orders/${id}`);
  revalidatePath("/admin/invoices");
}

export async function updateTechnicianLocation(formData: FormData) {
  const profile = await requireProfile(["technician"]);
  if (!profile) return { error: "غير مصرح" };

  const supabase = await createAuthServerClient();
  const lat = Number(formData.get("lat"));
  const lng = Number(formData.get("lng"));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return { error: "إحداثيات غير صالحة" };
  }

  const { error } = await supabase.from("technician_locations").upsert({
    technician_id: profile.id,
    lat,
    lng,
    updated_at: new Date().toISOString(),
  });

  if (error) return { error: error.message };
  return { success: true };
}
