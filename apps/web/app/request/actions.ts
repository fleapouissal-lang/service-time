"use server";

import type { ExecutionMethod, ServiceType } from "@service-time/types";
import { redirect } from "next/navigation";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { saveClientVehicle } from "@/lib/client-vehicles";
import { ensureServerEnv } from "@/lib/env-server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getExecutionMethodLabels, getServiceTypeLabels } from "@/lib/i18n/labels";
import { getLocale } from "@/lib/i18n/get-locale";
import { notifyOrderCreated } from "@/lib/order-notifications";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";
import {
  formHasPhotoField,
  getPhotoFromFormData,
  uploadRequestPhoto,
} from "@/lib/upload-request-photo";
import {
  FIELD_LIMITS,
  checkAuthenticatedFormGuard,
  clampField,
  resolveFormGuardError,
} from "@/lib/form-security";

export interface RequestFormState {
  error?: string;
  success?: boolean;
  trackingToken?: string;
}

export async function submitServiceRequest(
  _prev: RequestFormState,
  formData: FormData,
): Promise<RequestFormState> {
  const t = getDictionary(await getLocale());
  const profile = await requireProfile(["client"]);
  if (!profile) {
    return { error: t.errors.request.loginRequired };
  }

  const guard = await checkAuthenticatedFormGuard(
    formData,
    "serviceRequest",
    profile.id,
  );
  if (!guard.allowed) {
    if (guard.honeypot) return { success: true };
    const message = resolveFormGuardError(guard, t.errors.forms);
    return { error: message ?? t.errors.forms.invalidSubmission };
  }

  const customer_name = clampField(
    String(formData.get("customer_name") ?? ""),
    FIELD_LIMITS.name,
  );
  const customer_phone = clampField(
    String(formData.get("customer_phone") ?? ""),
    FIELD_LIMITS.phone,
  );
  const car_type = clampField(String(formData.get("car_type") ?? ""), FIELD_LIMITS.car);
  const location_text = clampField(
    String(formData.get("location_text") ?? ""),
    FIELD_LIMITS.location,
  );
  const location_lat_raw = String(formData.get("location_lat") ?? "").trim();
  const location_lng_raw = String(formData.get("location_lng") ?? "").trim();
  const location_lat = location_lat_raw ? Number(location_lat_raw) : null;
  const location_lng = location_lng_raw ? Number(location_lng_raw) : null;
  const description = clampField(
    String(formData.get("description") ?? ""),
    FIELD_LIMITS.description,
  );
  const service_type = String(
    formData.get("service_type") ?? "",
  ) as ServiceType;
  const execution_method = String(
    formData.get("execution_method") ?? "",
  ) as ExecutionMethod;
  const priceRaw = String(formData.get("client_proposed_price") ?? "").trim();
  const client_proposed_price = priceRaw ? Number(priceRaw) : null;
  const photo = getPhotoFromFormData(formData);
  const hadPhotoField = formHasPhotoField(formData);

  if (!customer_name || !customer_phone) {
    return { error: t.errors.request.namePhoneRequired };
  }

  if (
    !["periodic_maintenance", "emergency"].includes(service_type)
  ) {
    return { error: t.errors.request.invalidServiceType };
  }

  if (!["workshop_visit", "mobile_workshop"].includes(execution_method)) {
    return { error: t.errors.request.invalidExecutionMethod };
  }

  if (
    client_proposed_price == null ||
    !Number.isFinite(client_proposed_price) ||
    client_proposed_price <= 0
  ) {
    return { error: t.errors.request.invalidPrice };
  }

  if (hadPhotoField && !photo) {
    return {
      error: t.errors.request.photoReadFailed,
    };
  }

  ensureServerEnv();

  const supabase = await createAuthServerClient();
  const phone = profile.phone?.trim() || customer_phone;

  const { data, error } = await supabase.rpc("create_service_request", {
    p_customer_name: customer_name,
    p_customer_phone: phone,
    p_car_type: car_type,
    p_location_text: location_text,
    p_description: description,
    p_service_type: service_type,
    p_execution_method: execution_method,
    p_location_lat:
      location_lat !== null && Number.isFinite(location_lat)
        ? location_lat
        : null,
    p_location_lng:
      location_lng !== null && Number.isFinite(location_lng)
        ? location_lng
        : null,
    p_client_proposed_price: client_proposed_price,
  });

  if (error) {
    if (error.message.includes("duplicate") || error.code === "P0001") {
      return {
        error: t.errors.request.duplicateRequest,
      };
    }
    if (
      error.message.includes("create_service_request") ||
      error.message.includes("schema cache")
    ) {
      return {
        error: t.errors.request.dbIncomplete,
      };
    }
    return { error: error.message };
  }

  const row = (data as { id: string; tracking_token: string }[] | null)?.[0];
  if (!row) {
    return { error: t.errors.request.createFailed };
  }

  if (photo) {
    const upload = await uploadRequestPhoto(row.id, photo);

    if ("error" in upload) {
      await supabase.rpc("delete_service_request_draft", {
        p_request_id: row.id,
      });
      return { error: upload.error };
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);

  void notifyOrderCreated({
    requestId: row.id,
    customerName: customer_name,
    customerPhone: phone,
    customerEmail: user?.email ?? null,
    trackingToken: row.tracking_token,
    serviceType: service_type,
    executionMethod: execution_method,
    serviceTypeLabel: serviceTypeLabels[service_type],
    executionMethodLabel: executionMethodLabels[execution_method],
    carType: car_type || null,
    locationText: location_text || null,
  }).catch((err) => console.error("[request] order notify:", err));

  if (car_type) {
    await saveClientVehicle(profile.id, car_type);
  }

  revalidateServiceRequestDashboards();

  const refreshDashboard = formData.get("refresh_dashboard") === "1";
  if (refreshDashboard) {
    return {
      success: true,
      trackingToken: row.tracking_token,
    };
  }

  redirect(`/client/track/${row.tracking_token}?success=1`);
}
