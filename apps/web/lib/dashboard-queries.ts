import type {
  Profile,
  Service,
  ServiceRequest,
  SiteContent,
  SparePart,
} from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";

export async function getAllServiceRequests(): Promise<ServiceRequest[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as ServiceRequest[];
}

export async function getTechnicianRequests(
  technicianId: string,
): Promise<ServiceRequest[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .eq("assigned_technician_id", technicianId)
    .order("created_at", { ascending: false });
  return (data ?? []) as ServiceRequest[];
}

export async function getAllServicesAdmin(): Promise<Service[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as Service[];
}

export async function getServiceById(id: string): Promise<Service | null> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as Service | null) ?? null;
}

export async function getAllSparePartsAdmin(): Promise<SparePart[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("spare_parts")
    .select("*")
    .order("name_ar", { ascending: true });
  return (data ?? []) as SparePart[];
}

export async function getTechnicians(): Promise<Profile[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "technician")
    .order("full_name", { ascending: true });
  return (data ?? []) as Profile[];
}

export async function getAllSiteContent(): Promise<SiteContent[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("site_content")
    .select("*")
    .order("key", { ascending: true });
  return (data ?? []) as SiteContent[];
}

export async function getOrderStats() {
  const requests = await getAllServiceRequests();
  const byStatus: Record<string, number> = {};
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  return {
    total: requests.length,
    byStatus,
    highPriority: requests.filter((r) => r.priority === "high").length,
  };
}

export async function getRequestById(
  id: string,
): Promise<ServiceRequest | null> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as ServiceRequest | null) ?? null;
}

export async function getSparePartById(id: string): Promise<SparePart | null> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("spare_parts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as SparePart | null) ?? null;
}

export async function getClientRequests(): Promise<ServiceRequest[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as ServiceRequest[];
}

export async function getClientOrderStats() {
  const requests = await getClientRequests();
  const byStatus: Record<string, number> = {};
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  return {
    total: requests.length,
    byStatus,
    active: requests.filter(
      (r) => r.status !== "completed" && r.status !== "cancelled",
    ).length,
  };
}

export async function getActiveTechnicianCount(): Promise<number> {
  const technicians = await getTechnicians();
  return technicians.filter((t) => t.is_active).length;
}

export async function getTechnicianOrderStats(technicianId: string) {
  const requests = await getTechnicianRequests(technicianId);
  const byStatus: Record<string, number> = {};
  for (const r of requests) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return {
    total: requests.length,
    byStatus,
    active: requests.filter(
      (r) => r.status !== "completed" && r.status !== "cancelled",
    ).length,
    highPriority: requests.filter((r) => r.priority === "high").length,
    inProgress:
      (byStatus.in_progress ?? 0) +
      (byStatus.on_the_way ?? 0) +
      (byStatus.arrived ?? 0),
    completedThisWeek: requests.filter(
      (r) => r.status === "completed" && new Date(r.updated_at) >= weekAgo,
    ).length,
  };
}

export async function getRequestStatusHistory(requestId: string) {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("request_status_history")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function getTechnicianLiveLocation(technicianId: string) {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("technician_locations")
    .select("lat, lng, updated_at")
    .eq("technician_id", technicianId)
    .maybeSingle();
  return data;
}
