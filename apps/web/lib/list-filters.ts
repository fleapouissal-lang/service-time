import type { Profile, Service, ServiceRequest, SparePart } from "@service-time/types";

export type ListFilterParams = {
  q?: string;
  status?: string;
  priority?: string;
  service_type?: string;
  type?: string;
  execution_method?: string;
  active?: string;
  category?: string;
  role?: string;
  period?: string;
};

export function parseListFilters(
  searchParams: Record<string, string | undefined>,
): ListFilterParams {
  return {
    q: searchParams.q?.trim() || undefined,
    status: searchParams.status?.trim() || undefined,
    priority: searchParams.priority?.trim() || undefined,
    service_type: searchParams.service_type?.trim() || undefined,
    type: searchParams.type?.trim() || undefined,
    execution_method: searchParams.execution_method?.trim() || undefined,
    active: searchParams.active?.trim() || undefined,
    category: searchParams.category?.trim() || undefined,
    role: searchParams.role?.trim() || undefined,
    period: searchParams.period?.trim() || undefined,
  };
}

export function hasActiveListFilters(params: ListFilterParams): boolean {
  return Object.entries(params).some(
    ([, value]) => value && value !== "all",
  );
}

function matchesQuery(text: string | null | undefined, q: string) {
  if (!text) return false;
  return text.toLowerCase().includes(q.toLowerCase());
}

function filterByPeriod(createdAt: string, period?: string) {
  if (!period || period === "all") return true;

  const created = new Date(createdAt);
  const now = new Date();

  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    return created >= start && created < end;
  }

  if (period === "month") {
    return (
      created.getFullYear() === now.getFullYear() &&
      created.getMonth() === now.getMonth()
    );
  }

  if (period === "year") {
    return created.getFullYear() === now.getFullYear();
  }

  const daysMap: Record<string, number> = { "7d": 7, "30d": 30, "90d": 90 };
  const days = daysMap[period];
  if (!days) return true;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  return created >= cutoff;
}

export function filterServiceRequests(
  items: ServiceRequest[],
  params: ListFilterParams,
): ServiceRequest[] {
  return items.filter((item) => {
    if (!filterByPeriod(item.created_at, params.period)) return false;

    if (params.q) {
      const q = params.q.toLowerCase();
      const hit =
        matchesQuery(item.customer_name, q) ||
        matchesQuery(item.customer_phone, q) ||
        matchesQuery(item.car_type, q) ||
        matchesQuery(item.location_text, q) ||
        matchesQuery(item.tracking_token, q) ||
        matchesQuery(item.description, q);
      if (!hit) return false;
    }

    if (params.status && params.status !== "all" && item.status !== params.status) {
      return false;
    }

    if (
      params.priority &&
      params.priority !== "all" &&
      item.priority !== params.priority
    ) {
      return false;
    }

    if (
      params.service_type &&
      params.service_type !== "all" &&
      item.service_type !== params.service_type
    ) {
      return false;
    }

    if (
      params.execution_method &&
      params.execution_method !== "all" &&
      item.execution_method !== params.execution_method
    ) {
      return false;
    }

    return true;
  });
}

export function filterServices(
  items: Service[],
  params: ListFilterParams,
): Service[] {
  return items.filter((item) => {
    if (params.q) {
      const q = params.q.toLowerCase();
      const hit =
        matchesQuery(item.name_ar, q) ||
        matchesQuery(item.name_en, q) ||
        matchesQuery(item.description_ar, q) ||
        matchesQuery(item.description_en, q) ||
        matchesQuery(item.category, q);
      if (!hit) return false;
    }

    if (
      params.service_type &&
      params.service_type !== "all" &&
      item.service_type !== params.service_type
    ) {
      return false;
    }

    if (params.active === "active" && !item.is_active) return false;
    if (params.active === "inactive" && item.is_active) return false;

    return true;
  });
}

export function filterSpareParts(
  items: SparePart[],
  params: ListFilterParams,
): SparePart[] {
  return items.filter((item) => {
    if (params.q) {
      const q = params.q.toLowerCase();
      const hit =
        matchesQuery(item.name_ar, q) ||
        matchesQuery(item.name_en, q) ||
        matchesQuery(item.description_ar, q) ||
        matchesQuery(item.description_en, q) ||
        matchesQuery(item.category, q) ||
        matchesQuery(item.category_en, q) ||
        matchesQuery(item.details, q) ||
        matchesQuery(item.details_en, q);
      if (!hit) return false;
    }

    if (
      params.category &&
      params.category !== "all" &&
      (item.category ?? "") !== params.category
    ) {
      return false;
    }

    if (params.active === "active" && !item.is_active) return false;
    if (params.active === "inactive" && item.is_active) return false;

    return true;
  });
}

export function filterProfiles(
  items: Profile[],
  params: ListFilterParams,
): Profile[] {
  return items.filter((item) => {
    if (params.q) {
      const q = params.q.toLowerCase();
      const hit =
        matchesQuery(item.full_name, q) || matchesQuery(item.phone, q);
      if (!hit) return false;
    }

    if (params.role && params.role !== "all" && item.role !== params.role) {
      return false;
    }

    if (params.active === "active" && !item.is_active) return false;
    if (params.active === "inactive" && item.is_active) return false;

    return true;
  });
}

export function filterSiteContentKeys<
  T extends { key: string },
>(items: T[], params: ListFilterParams): T[] {
  if (!params.q) return items;
  const q = params.q.toLowerCase();
  return items.filter((item) => item.key.toLowerCase().includes(q));
}

export function uniqueCategories(items: SparePart[]): string[] {
  return [
    ...new Set(
      items.map((p) => p.category).filter((c): c is string => Boolean(c)),
    ),
  ].sort((a, b) => a.localeCompare(b, "ar"));
}
