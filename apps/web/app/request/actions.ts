"use server";

import type { ExecutionMethod, ServiceType } from "@service-time/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createWebSupabaseClient } from "@/lib/supabase";
import { requireProfile } from "@/lib/auth";
import { ensureServerEnv } from "@/lib/env-server";
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
  const profile = await requireProfile(["client"]);
  if (!profile) {
    return { error: "يجب تسجيل الدخول كعميل لإرسال طلب." };
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
    return { error: "الاسم ورقم الجوال مطلوبان" };
  }

  if (
    !["periodic_maintenance", "emergency"].includes(service_type)
  ) {
    return { error: "نوع الخدمة غير صالح" };
  }

  if (!["workshop_visit", "mobile_workshop"].includes(execution_method)) {
    return { error: "طريقة التنفيذ غير صالحة" };
  }

  if (hadPhotoField && !photo) {
    return {
      error:
        "تعذر قراءة الصورة. جرب صورة أصغر (≤5 MB) أو صيغة JPG/PNG.",
    };
  }

  ensureServerEnv();

  const supabase = createWebSupabaseClient();

  const { data, error } = await supabase.rpc("create_service_request", {
    p_customer_name: customer_name,
    p_customer_phone: customer_phone,
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
        error:
          "تم إرسال طلب مشابه مؤخراً. يرجى الانتظار قبل إرسال طلب جديد.",
      };
    }
    if (
      error.message.includes("create_service_request") ||
      error.message.includes("schema cache")
    ) {
      return {
        error:
          "إعدادات قاعدة البيانات غير مكتملة. تواصل مع الدعم أو نفّذ migration create_service_request_rpc.",
      };
    }
    return { error: error.message };
  }

  const row = (data as { id: string; tracking_token: string }[] | null)?.[0];
  if (!row) {
    return { error: "فشل إنشاء الطلب" };
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

  revalidatePath("/client/track");
  revalidatePath("/client/orders");
  revalidatePath("/request");
  redirect(`/client/track/${row.tracking_token}?success=1`);
}
