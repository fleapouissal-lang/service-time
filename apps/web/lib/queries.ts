import type {
  RequestStatusHistory,
  Service,
  ServiceRequest,
  SiteContent,
  SparePart,
} from "@service-time/types";
import type { WorkshopBranch } from "@/lib/localized-content";
import { enrichWorkshopBranches } from "@/lib/localized-content";
import { createWebSupabaseClient } from "@/lib/supabase";

export type { WorkshopBranch };

export async function getServices(): Promise<Service[]> {
  const supabase = createWebSupabaseClient();
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) return [];
  return (data ?? []) as Service[];
}

export const SPARE_PARTS_PAGE_SIZE = 12;
export const SPARE_PARTS_MOBILE_PAGE_SIZE = 6;

export function resolveSparePartsPageSize(sizeParam?: string): number {
  const parsed = Number(sizeParam);
  if (parsed === SPARE_PARTS_MOBILE_PAGE_SIZE) return SPARE_PARTS_MOBILE_PAGE_SIZE;
  return SPARE_PARTS_PAGE_SIZE;
}

export async function getSpareParts(): Promise<SparePart[]> {
  const supabase = createWebSupabaseClient();
  const { data, error } = await supabase
    .from("spare_parts")
    .select("*")
    .eq("is_active", true)
    .order("name_ar", { ascending: true });

  if (error) return [];
  return (data ?? []) as SparePart[];
}

export async function getSparePartsPage(
  page: number,
  pageSize: number = SPARE_PARTS_PAGE_SIZE,
): Promise<{
  parts: SparePart[];
  total: number;
}> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createWebSupabaseClient();
  const { data, error, count } = await supabase
    .from("spare_parts")
    .select("*", { count: "exact" })
    .eq("is_active", true)
    .order("name_ar", { ascending: true })
    .range(from, to);

  if (error) return { parts: [], total: 0 };
  return { parts: (data ?? []) as SparePart[], total: count ?? 0 };
}

export async function getLatestSpareParts(limit = 6): Promise<SparePart[]> {
  const supabase = createWebSupabaseClient();
  const { data, error } = await supabase
    .from("spare_parts")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data ?? []) as SparePart[];
}

export async function getSiteContent(
  key: string,
): Promise<Record<string, unknown> | null> {
  const supabase = createWebSupabaseClient();
  const { data, error } = await supabase
    .from("site_content")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error || !data) return null;
  return (data as SiteContent).value;
}

export async function getWorkshops(): Promise<WorkshopBranch[]> {
  const content = await getSiteContent("locations.workshops");
  if (!content || !Array.isArray(content.branches)) return [];
  return enrichWorkshopBranches(content.branches as WorkshopBranch[]);
}

export async function getTrackingRequest(
  token: string,
): Promise<ServiceRequest | null> {
  const supabase = createWebSupabaseClient();
  const normalized = token.trim();
  if (!normalized) return null;

  const { data, error } = await supabase.rpc("get_request_by_tracking_token", {
    p_token: normalized,
  });

  if (error) return null;
  const rows = data as ServiceRequest[] | null;
  return rows?.[0] ?? null;
}

export async function getTrackingHistory(
  token: string,
): Promise<RequestStatusHistory[]> {
  const supabase = createWebSupabaseClient();
  const normalized = token.trim();
  if (!normalized) return [];

  const { data, error } = await supabase.rpc(
    "get_request_status_history_by_token",
    { p_token: normalized },
  );

  if (error) return [];
  return (data ?? []) as RequestStatusHistory[];
}

export type TechnicianLiveLocation = {
  lat: number;
  lng: number;
  updated_at: string;
};

export async function getTechnicianLocationForTracking(
  token: string,
): Promise<TechnicianLiveLocation | null> {
  const supabase = createWebSupabaseClient();
  const normalized = token.trim();
  if (!normalized) return null;

  const { data, error } = await supabase.rpc(
    "get_technician_location_for_tracking",
    { p_token: normalized },
  );

  if (error || !data?.length) return null;
  const row = data[0] as TechnicianLiveLocation;
  return row;
}
