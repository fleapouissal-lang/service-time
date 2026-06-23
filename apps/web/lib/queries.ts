import type {
  RequestStatusHistory,
  ServiceRequest,
  SiteContent,
  SparePart,
} from "@service-time/types";
import type { WorkshopBranch } from "@/lib/localized-content";
import { createAuthServerClient } from "@/lib/auth";
import { enrichWorkshopBranches } from "@/lib/localized-content";
import { SPARE_PARTS_PAGE_SIZE } from "@/lib/spare-parts-pagination";
import { createWebSupabaseClient } from "@/lib/supabase";

export type { WorkshopBranch };

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

export type SparePartsListFilters = {
  q?: string;
  category?: string;
  condition?: string;
};

export async function getSparePartsPage(
  page: number,
  pageSize: number = SPARE_PARTS_PAGE_SIZE,
  filters: SparePartsListFilters = {},
): Promise<{
  parts: SparePart[];
  total: number;
}> {
  const safePage = Math.max(1, page);
  const from = (safePage - 1) * pageSize;
  const to = from + pageSize - 1;

  const supabase = createWebSupabaseClient();
  let query = supabase
    .from("spare_parts")
    .select("*", { count: "exact" })
    .eq("is_active", true);

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.condition && filters.condition !== "all") {
    query = query.eq("part_condition", filters.condition);
  }

  if (filters.q) {
    const q = filters.q.replace(/[%_,]/g, " ").trim();
    if (q) {
      query = query.or(
        [
          `name_ar.ilike.%${q}%`,
          `name_en.ilike.%${q}%`,
          `description_ar.ilike.%${q}%`,
          `description_en.ilike.%${q}%`,
          `category.ilike.%${q}%`,
          `category_en.ilike.%${q}%`,
          `details.ilike.%${q}%`,
          `details_en.ilike.%${q}%`,
        ].join(","),
      );
    }
  }

  const { data, error, count } = await query
    .order("name_ar", { ascending: true })
    .range(from, to);

  if (error) return { parts: [], total: 0 };
  return { parts: (data ?? []) as SparePart[], total: count ?? 0 };
}

export async function getSparePartCategories(): Promise<string[]> {
  const supabase = createWebSupabaseClient();
  const { data, error } = await supabase
    .from("spare_parts")
    .select("category")
    .eq("is_active", true)
    .not("category", "is", null);

  if (error) return [];
  return [
    ...new Set(
      (data ?? [])
        .map((row) => row.category)
        .filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b, "ar"));
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
  const supabase = await createAuthServerClient();
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
  const supabase = await createAuthServerClient();
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
  const supabase = await createAuthServerClient();
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
