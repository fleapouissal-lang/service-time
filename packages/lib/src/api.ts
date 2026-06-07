import type { ServiceRequest } from "@service-time/types";
import { ServiceRequestStatus } from "@service-time/types";
import { createSupabaseClient } from "./supabase";

export interface SupabaseConnectionResult {
  connected: boolean;
  message: string;
}

export async function testSupabaseConnection(): Promise<SupabaseConnectionResult> {
  try {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return { connected: false, message: error.message };
    }

    return {
      connected: true,
      message: "Supabase client initialized successfully",
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown connection error";
    return { connected: false, message };
  }
}

export async function getServiceRequests(): Promise<ServiceRequest[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("service_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ServiceRequest[];
}

export async function getServiceRequestByTrackingToken(
  trackingToken: string,
): Promise<ServiceRequest | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase.rpc("get_request_by_tracking_token", {
    p_token: trackingToken,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as ServiceRequest[] | null;
  return rows?.[0] ?? null;
}

export interface CreateServiceRequestInput {
  customer_name: string;
  customer_phone: string;
  car_type?: string;
  location_text?: string;
  location_lat?: number;
  location_lng?: number;
  description?: string;
  service_type: ServiceRequest["service_type"];
  execution_method: ServiceRequest["execution_method"];
}

export async function createServiceRequest(
  input: CreateServiceRequestInput,
): Promise<ServiceRequest> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("service_requests")
    .insert({
      ...input,
      status: ServiceRequestStatus.RECEIVED,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as ServiceRequest;
}
