import type {
  SparePartOrder,
  SparePartOrderItem,
  Profile,
} from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type SparePartOrderWithItems = SparePartOrder & {
  items: SparePartOrderItem[];
  client?: Pick<Profile, "full_name" | "full_name_ar" | "full_name_en" | "phone"> | null;
};

export async function getClientSparePartOrders(
  clientId: string,
): Promise<SparePartOrder[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("spare_part_orders")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return (data as SparePartOrder[]) ?? [];
}

export async function getClientSparePartOrdersWithItems(
  clientId: string,
): Promise<SparePartOrderWithItems[]> {
  const orders = await getClientSparePartOrders(clientId);
  if (!orders.length) return [];

  const supabase = await createAuthServerClient();
  const orderIds = orders.map((order) => order.id);
  const { data: items } = await supabase
    .from("spare_part_order_items")
    .select("*")
    .in("order_id", orderIds)
    .order("created_at", { ascending: true });

  const itemsByOrder = new Map<string, SparePartOrderItem[]>();
  for (const item of (items as SparePartOrderItem[]) ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return orders.map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
  }));
}

export async function getClientSparePartOrder(
  clientId: string,
  orderId: string,
): Promise<SparePartOrderWithItems | null> {
  const supabase = await createAuthServerClient();
  const { data: order } = await supabase
    .from("spare_part_orders")
    .select("*")
    .eq("id", orderId)
    .eq("client_id", clientId)
    .maybeSingle();

  if (!order) return null;

  const { data: items } = await supabase
    .from("spare_part_order_items")
    .select("*")
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  return {
    ...(order as SparePartOrder),
    items: (items as SparePartOrderItem[]) ?? [],
  };
}

export async function getAdminSparePartOrders(): Promise<
  SparePartOrderWithItems[]
> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];
  const { data: orders } = await supabase
    .from("spare_part_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const clientIds = [...new Set(orders.map((o) => o.client_id))];

  const [{ data: items }, { data: profiles }] = await Promise.all([
    supabase
      .from("spare_part_order_items")
      .select("*")
      .in("order_id", orderIds),
    supabase
      .from("profiles")
      .select("id, full_name, full_name_ar, full_name_en, phone")
      .in("id", clientIds),
  ]);

  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        full_name: p.full_name,
        full_name_ar: p.full_name_ar,
        full_name_en: p.full_name_en,
        phone: p.phone,
      },
    ]),
  );

  const itemsByOrder = new Map<string, SparePartOrderItem[]>();
  for (const item of (items as SparePartOrderItem[]) ?? []) {
    const list = itemsByOrder.get(item.order_id) ?? [];
    list.push(item);
    itemsByOrder.set(item.order_id, list);
  }

  return (orders as SparePartOrder[]).map((order) => ({
    ...order,
    items: itemsByOrder.get(order.id) ?? [],
    client: profileMap.get(order.client_id) ?? null,
  }));
}

export async function getAdminSparePartOrderById(
  orderId: string,
): Promise<SparePartOrderWithItems | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data: order } = await supabase
    .from("spare_part_orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return null;

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from("spare_part_order_items")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, full_name_ar, full_name_en, phone")
      .eq("id", order.client_id)
      .maybeSingle(),
  ]);

  return {
    ...(order as SparePartOrder),
    items: (items as SparePartOrderItem[]) ?? [],
    client: profile
      ? {
          full_name: profile.full_name,
          full_name_ar: profile.full_name_ar,
          full_name_en: profile.full_name_en,
          phone: profile.phone,
        }
      : null,
  };
}
