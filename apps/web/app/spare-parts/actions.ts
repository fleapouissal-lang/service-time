"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireProfile } from "@/lib/auth";
import { createAuthServerClient } from "@/lib/auth";
import type { SparePartOrderStatus } from "@service-time/types";

export type SparePartOrderFormState = {
  error?: string;
};

export async function submitSparePartOrderAction(
  _prev: SparePartOrderFormState,
  formData: FormData,
): Promise<SparePartOrderFormState> {
  const profile = await requireProfile(["client"]);
  if (!profile) {
    redirect("/login?next=/spare-parts/checkout");
  }

  const notes = String(formData.get("notes") ?? "").trim();
  const itemsRaw = String(formData.get("items") ?? "");

  let items: { id: string; quantity: number }[];
  try {
    const parsed = JSON.parse(itemsRaw) as { id: string; quantity: number }[];
    items = parsed;
  } catch {
    return { error: "سلة غير صالحة" };
  }

  if (!Array.isArray(items) || items.length === 0) {
    return { error: "السلة فارغة" };
  }

  const payload = items.map((item) => ({
    spare_part_id: item.id,
    quantity: item.quantity,
  }));

  const supabase = await createAuthServerClient();
  const { data, error } = await supabase.rpc("create_spare_part_order", {
    p_notes: notes || null,
    p_items: payload,
  });

  if (error) {
    if (error.message.includes("client_required")) {
      redirect("/login?next=/spare-parts/checkout");
    }
    return { error: error.message };
  }

  const row = (data as { id: string; order_token: string }[] | null)?.[0];
  if (!row) {
    return { error: "فشل إنشاء الطلب" };
  }

  revalidatePath("/client/spare-part-orders");
  revalidatePath("/admin/spare-part-orders");
  redirect(`/client/spare-part-orders/${row.id}?success=1`);
}

export async function updateSparePartOrderStatusAction(formData: FormData) {
  const profile = await requireProfile(["admin"]);
  if (!profile) return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as SparePartOrderStatus;

  const allowed: SparePartOrderStatus[] = [
    "pending",
    "confirmed",
    "preparing",
    "ready",
    "delivered",
    "cancelled",
  ];

  if (!id || !allowed.includes(status)) return;

  const supabase = await createAuthServerClient();
  await supabase.from("spare_part_orders").update({ status }).eq("id", id);

  revalidatePath("/admin/spare-part-orders");
  revalidatePath(`/client/spare-part-orders/${id}`);
}
