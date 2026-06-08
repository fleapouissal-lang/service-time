"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type {
  ExecutionMethod,
  ProfileRole,
  RequestPriority,
  ServiceRequestStatus,
  ServiceType,
  TechnicianType,
} from "@service-time/types";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isQuotePending } from "@/lib/suggest-service-price";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { resolveSparePartImagesFromForm } from "@/lib/spare-part-image";
import {
  getAvatarFromFormData,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";
import { getPlatformUserById } from "@/lib/admin-dashboard-data";
import { resolveQuickRequestClient } from "@/lib/quick-request-client";
import { notifyOrderCreated } from "@/lib/order-notifications";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";
import { saveClientVehicleAsAdmin } from "@/lib/client-vehicles";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";
import { normalizePhone } from "@/lib/whatsapp-utils";

function parseOrderLocation(formData: FormData) {
  const locationText =
    String(formData.get("location_text") ?? "").trim() || null;
  const latRaw = String(formData.get("location_lat") ?? "").trim();
  const lngRaw = String(formData.get("location_lng") ?? "").trim();
  const lat = latRaw ? Number(latRaw) : null;
  const lng = lngRaw ? Number(lngRaw) : null;

  return {
    location_text: locationText,
    location_lat:
      lat !== null && Number.isFinite(lat) ? lat : null,
    location_lng:
      lng !== null && Number.isFinite(lng) ? lng : null,
  };
}

async function adminClient() {
  const profile = await requireProfile(["admin"]);
  if (!profile) throw new Error("غير مصرح");
  return createAuthServerClient();
}

export type UpdateOrderFormState = {
  success?: boolean;
  error?: string;
};

export async function updateOrderAction(
  _prev: UpdateOrderFormState,
  formData: FormData,
): Promise<UpdateOrderFormState> {
  try {
    const t = getDictionary(await getLocale());
    const supabase = await adminClient();
    const id = String(formData.get("id"));
    const status = String(formData.get("status")) as ServiceRequestStatus;
    const priority = String(formData.get("priority")) as RequestPriority;
    const assigned = String(formData.get("assigned_technician_id") ?? "");
    const location = parseOrderLocation(formData);

    const { data: existing } = await supabase
      .from("service_requests")
      .select("client_proposed_price, quote_status")
      .eq("id", id)
      .maybeSingle();

    if (existing && isQuotePending(existing)) {
      if (assigned) {
        return { error: t.errors.quote.notAccepted };
      }
      if (
        status !== "received" &&
        status !== "cancelled"
      ) {
        return { error: t.errors.quote.notAccepted };
      }
    }

    const { error } = await supabase
      .from("service_requests")
      .update({
        status,
        priority,
        assigned_technician_id: assigned || null,
        ...location,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteAdminOrderAction(formData: FormData) {
  await requireProfile(["admin"]);
  const admin = getAdminSupabaseClient();
  if (!admin) throw new Error("إعدادات الخادم غير مكتملة.");

  const id = String(formData.get("id"));
  const { error } = await admin.from("service_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect("/admin/orders");
}

export async function saveServiceAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const payload = {
    name_ar: String(formData.get("name_ar")),
    name_en: String(formData.get("name_en") ?? "").trim() || null,
    description_ar: String(formData.get("description_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? "").trim() || null,
    category: String(formData.get("category") ?? ""),
    service_type: String(formData.get("service_type")),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };

  const { data, error } = id
    ? await supabase.from("services").update(payload).eq("id", id).select("id").single()
    : await supabase.from("services").insert(payload).select("id").single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  if (id) {
    revalidatePath(`/admin/services/${id}`);
  } else if (data?.id) {
    redirect(`/admin/services/${data.id}`);
  }
}

export type SaveServiceFormState = {
  success?: boolean;
  error?: string;
};

function buildServicePayload(formData: FormData) {
  return {
    name_ar: String(formData.get("name_ar")),
    name_en: String(formData.get("name_en") ?? "").trim() || null,
    description_ar: String(formData.get("description_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? "").trim() || null,
    category: String(formData.get("category") ?? ""),
    service_type: String(formData.get("service_type")),
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };
}

export async function saveServiceEditAction(
  _prev: SaveServiceFormState,
  formData: FormData,
): Promise<SaveServiceFormState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing service id" };

    const { error } = await supabase
      .from("services")
      .update(buildServicePayload(formData))
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/services");
    revalidatePath(`/admin/services/${id}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteServiceAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
  redirect("/admin/services");
}

export async function saveSparePartAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const images = await resolveSparePartImagesFromForm(formData);
  const img = images[0] ?? null;

  const priceRaw = String(formData.get("price") ?? "0").trim();
  const price = Math.max(0, Number.parseFloat(priceRaw) || 0);
  const stockRaw = String(formData.get("stock_quantity") ?? "0").trim();
  const stock_quantity = Math.max(0, Number.parseInt(stockRaw, 10) || 0);

  const payload = {
    name_ar: String(formData.get("name_ar")),
    name_en: String(formData.get("name_en") ?? "").trim() || null,
    description_ar: String(formData.get("description_ar") ?? ""),
    description_en: String(formData.get("description_en") ?? "").trim() || null,
    category: String(formData.get("category") ?? ""),
    category_en: String(formData.get("category_en") ?? "").trim() || null,
    details: String(formData.get("details") ?? ""),
    details_en: String(formData.get("details_en") ?? "").trim() || null,
    img,
    images,
    price,
    stock_quantity,
    is_active: formData.get("is_active") === "on",
  };

  const { data, error } = id
    ? await supabase
        .from("spare_parts")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase.from("spare_parts").insert(payload).select("id").single();

  if (error) throw new Error(error.message);
  revalidatePath("/admin/spare-parts");
  revalidatePath("/spare-parts");
  if (id) {
    revalidatePath(`/admin/spare-parts/${id}`);
  } else if (data?.id) {
    redirect(`/admin/spare-parts/${data.id}`);
  }
}

export type SaveSparePartFormState = {
  success?: boolean;
  error?: string;
};

export async function saveSparePartEditAction(
  _prev: SaveSparePartFormState,
  formData: FormData,
): Promise<SaveSparePartFormState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing part id" };

    const images = await resolveSparePartImagesFromForm(formData);
    const img = images[0] ?? null;

    const priceRaw = String(formData.get("price") ?? "0").trim();
    const price = Math.max(0, Number.parseFloat(priceRaw) || 0);
    const stockRaw = String(formData.get("stock_quantity") ?? "0").trim();
    const stock_quantity = Math.max(0, Number.parseInt(stockRaw, 10) || 0);

    const payload = {
      name_ar: String(formData.get("name_ar")),
      name_en: String(formData.get("name_en") ?? "").trim() || null,
      description_ar: String(formData.get("description_ar") ?? ""),
      description_en: String(formData.get("description_en") ?? "").trim() || null,
      category: String(formData.get("category") ?? ""),
      category_en: String(formData.get("category_en") ?? "").trim() || null,
      details: String(formData.get("details") ?? ""),
      details_en: String(formData.get("details_en") ?? "").trim() || null,
      img,
      images,
      price,
      stock_quantity,
      is_active: formData.get("is_active") === "on",
    };

    const { error } = await supabase
      .from("spare_parts")
      .update(payload)
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/spare-parts");
    revalidatePath(`/admin/spare-parts/${id}`);
    revalidatePath("/spare-parts");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteSparePartAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("spare_parts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/spare-parts");
  revalidatePath("/spare-parts");
  redirect("/admin/spare-parts");
}

export async function saveContentAction(formData: FormData) {
  const supabase = await adminClient();
  const key = String(formData.get("key"));
  const valueRaw = String(formData.get("value_json"));

  let value: Record<string, unknown>;
  try {
    value = JSON.parse(valueRaw) as Record<string, unknown>;
  } catch {
    throw new Error("JSON غير صالح");
  }

  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/content");
}

export async function togglePlatformUserAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id"));
  const is_active = formData.get("is_active") === "true";

  const { error } = await supabase
    .from("profiles")
    .update({ is_active: !is_active })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/users");
  revalidatePath("/admin/technicians");
  revalidatePath(`/admin/users/${id}`);
}

/** @deprecated Utiliser togglePlatformUserAction */
export async function toggleTechnicianAction(formData: FormData) {
  return togglePlatformUserAction(formData);
}

export async function createPlatformUserAction(formData: FormData) {
  await requireProfile(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("إعدادات الخادم غير مكتملة.");
  }

  const fullNameAr = String(formData.get("full_name_ar") ?? "").trim();
  const fullNameEn = String(formData.get("full_name_en") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const role = String(formData.get("role") ?? "technician") as ProfileRole;
  const technicianTypeRaw = String(formData.get("technician_type") ?? "").trim();
  const avatarFile = getAvatarFromFormData(formData);

  if (fullNameAr.length < 2) {
    throw new Error("أدخل الاسم بالعربية.");
  }

  if (fullNameEn.length < 2) {
    throw new Error("أدخل الاسم بالإنجليزية.");
  }

  if (!email.includes("@")) {
    throw new Error("البريد الإلكتروني غير صالح.");
  }

  if (password.length < 8) {
    throw new Error("كلمة المرور يجب أن تكون 8 أحرف على الأقل.");
  }

  if (!["client", "technician", "admin"].includes(role)) {
    throw new Error("نوع الحساب غير صالح.");
  }

  let technicianType: TechnicianType | null = null;
  if (role === "technician") {
    if (technicianTypeRaw !== "mobile" && technicianTypeRaw !== "workshop") {
      throw new Error("اختر نوع الفني.");
    }
    technicianType = technicianTypeRaw;
  }

  const localizedNames = await resolveProfileNamesFromFields(
    fullNameAr,
    fullNameEn,
  );

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: localizedNames.full_name,
        phone,
      },
    });

  if (createError || !created.user) {
    throw new Error(createError?.message ?? "تعذّر إنشاء الحساب.");
  }

  const userId = created.user.id;
  let avatarUrl: string | null = null;

  if (avatarFile) {
    const uploaded = await uploadProfileAvatar(userId, avatarFile);
    if ("error" in uploaded) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(uploaded.error);
    }
    avatarUrl = uploaded.publicUrl;
  }

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: localizedNames.full_name,
      full_name_ar: localizedNames.full_name_ar,
      full_name_en: localizedNames.full_name_en,
      phone,
      role,
      technician_type: technicianType,
      is_active: true,
      avatar_url: avatarUrl,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    await admin.auth.admin.deleteUser(userId);
    throw new Error(profileError.message);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export type CreateAdminOrderFormState = {
  success?: boolean;
  error?: string;
};

const ADMIN_ORDER_SERVICE_TYPES: ServiceType[] = [
  "periodic_maintenance",
  "emergency",
  "spare_parts",
];

const ADMIN_ORDER_EXECUTION_METHODS: ExecutionMethod[] = [
  "workshop_visit",
  "mobile_workshop",
];

const ADMIN_ORDER_PRIORITIES: RequestPriority[] = ["low", "normal", "high"];

function mapQuickClientError(code: string): string {
  switch (code) {
    case "email_used_non_client":
      return "البريد الإلكتروني مستخدم لحساب غير عميل.";
    case "create_user_failed":
      return "تعذّر إنشاء حساب العميل.";
    case "create_profile_failed":
      return "تعذّر إنشاء ملف العميل.";
    case "server_incomplete":
      return "إعدادات الخادم غير مكتملة.";
    default:
      return "تعذّر إعداد العميل.";
  }
}

export async function createAdminOrderAction(
  _prev: CreateAdminOrderFormState,
  formData: FormData,
): Promise<CreateAdminOrderFormState> {
  await requireProfile(["admin"]);
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { error: mapQuickClientError("server_incomplete") };
  }

  const clientMode = String(formData.get("client_mode") ?? "existing");
  let clientId: string;
  let customerName: string;
  let customerPhone: string;

  if (clientMode === "new") {
    const fullName = String(formData.get("customer_name") ?? "").trim();
    const phoneRaw = String(formData.get("customer_phone") ?? "").trim();
    const emailRaw = String(formData.get("customer_email") ?? "").trim();

    if (fullName.length < 2) {
      return { error: "أدخل اسم العميل." };
    }
    if (!phoneRaw) {
      return { error: "رقم هاتف العميل مطلوب." };
    }

    const resolved = await resolveQuickRequestClient({
      fullName,
      phone: phoneRaw,
      email: emailRaw || null,
    });

    if (!resolved.ok) {
      return { error: mapQuickClientError(resolved.error) };
    }

    clientId = resolved.result.clientId;
    customerName = fullName;
    customerPhone = normalizePhone(phoneRaw);
  } else {
    clientId = String(formData.get("client_id") ?? "").trim();
    if (!clientId) {
      return { error: "اختر عميلاً مسجّلاً." };
    }

    const client = await getPlatformUserById(clientId);
    if (!client || client.role !== "client") {
      return { error: "العميل المحدد غير موجود." };
    }
    if (!client.phone?.trim()) {
      return { error: "العميل المحدد لا يملك رقم هاتف." };
    }

    customerName = client.full_name;
    customerPhone = normalizePhone(client.phone);
  }

  const serviceType = String(
    formData.get("service_type") ?? "",
  ) as ServiceType;
  const executionMethod = String(
    formData.get("execution_method") ?? "",
  ) as ExecutionMethod;
  const priority = String(
    formData.get("priority") ?? "normal",
  ) as RequestPriority;

  if (!ADMIN_ORDER_SERVICE_TYPES.includes(serviceType)) {
    return { error: "نوع الخدمة غير صالح." };
  }
  if (!ADMIN_ORDER_EXECUTION_METHODS.includes(executionMethod)) {
    return { error: "طريقة التنفيذ غير صالحة." };
  }
  if (!ADMIN_ORDER_PRIORITIES.includes(priority)) {
    return { error: "الأولوية غير صالحة." };
  }

  const carType = String(formData.get("car_type") ?? "").trim() || null;
  const location = parseOrderLocation(formData);
  const description =
    String(formData.get("description") ?? "").trim() || null;
  const assignedRaw = String(
    formData.get("assigned_technician_id") ?? "",
  ).trim();
  const assignedTechnicianId = assignedRaw || null;

  if (assignedTechnicianId) {
    const technician = await getPlatformUserById(assignedTechnicianId);
    if (!technician || technician.role !== "technician") {
      return { error: "الفني المحدد غير صالح." };
    }
  }

  const { data, error } = await admin
    .from("service_requests")
    .insert({
      client_id: clientId,
      customer_name: customerName,
      customer_phone: customerPhone,
      car_type: carType,
      location_text: location.location_text,
      location_lat: location.location_lat,
      location_lng: location.location_lng,
      description,
      service_type: serviceType,
      execution_method: executionMethod,
      status: "received",
      priority,
      assigned_technician_id: assignedTechnicianId,
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    return { error: error?.message ?? "تعذّر إنشاء الطلب." };
  }

  if (carType) {
    await saveClientVehicleAsAdmin(clientId, carType);
  }

  revalidateServiceRequestDashboards();

  return { success: true };
}
