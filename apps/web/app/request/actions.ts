"use server";

import type { ExecutionMethod, ServiceType } from "@service-time/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { ensureServerEnv } from "@/lib/env-server";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getExecutionMethodLabels, getServiceTypeLabels } from "@/lib/i18n/labels";
import { getLocale } from "@/lib/i18n/get-locale";
import { notifyOrderCreated } from "@/lib/order-notifications";
import { saveClientVehicle } from "@/lib/client-vehicles";
import {
  formHasPhotoField,
  getPhotoFromFormData,
  uploadRequestPhoto,
} from "@/lib/upload-request-photo";

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

  const customer_name = String(formData.get("customer_name") ?? "").trim();
  const customer_phone = String(formData.get("customer_phone") ?? "").trim();
  const car_type = String(formData.get("car_type") ?? "").trim();
  const location_text = String(formData.get("location_text") ?? "").trim();
  const location_lat_raw = String(formData.get("location_lat") ?? "").trim();
  const location_lng_raw = String(formData.get("location_lng") ?? "").trim();
  const location_lat = location_lat_raw ? Number(location_lat_raw) : null;
  const location_lng = location_lng_raw ? Number(location_lng_raw) : null;
  const description = String(formData.get("description") ?? "").trim();
  const service_type = String(
    formData.get("service_type") ?? "",
  ) as ServiceType;
  const execution_method = String(
    formData.get("execution_method") ?? "",
  ) as ExecutionMethod;
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

  revalidatePath("/client/track");
  revalidatePath("/client/orders");
  revalidatePath("/request");
  redirect(`/client/track/${row.tracking_token}?success=1`);
}
