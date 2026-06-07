"use server";

import { revalidatePath } from "next/cache";
import type {
  ProfileRole,
  RequestPriority,
  ServiceRequestStatus,
  TechnicianType,
} from "@service-time/types";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { saveSparePartImage } from "@/lib/spare-part-image";
import {
  getAvatarFromFormData,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";
import { normalizePhone } from "@/lib/whatsapp";

async function adminClient() {
  const profile = await requireProfile(["admin"]);
  if (!profile) throw new Error("غير مصرح");
  return createAuthServerClient();
}

export async function updateOrderAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as ServiceRequestStatus;
  const priority = String(formData.get("priority")) as RequestPriority;
  const assigned = String(formData.get("assigned_technician_id") ?? "");

  const { error } = await supabase
    .from("service_requests")
    .update({
      status,
      priority,
      assigned_technician_id: assigned || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
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

  const { error } = id
    ? await supabase.from("services").update(payload).eq("id", id)
    : await supabase.from("services").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
}

export async function deleteServiceAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("services").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/services");
}

export async function saveSparePartAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id") ?? "");
  const existingImg = String(formData.get("existing_img") ?? "").trim();
  const imgFile = formData.get("img");

  let img: string | null = existingImg || null;

  if (imgFile instanceof File && imgFile.size > 0) {
    img = await saveSparePartImage(imgFile);
  }

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
    price,
    stock_quantity,
    is_active: formData.get("is_active") === "on",
  };

  const { error } = id
    ? await supabase.from("spare_parts").update(payload).eq("id", id)
    : await supabase.from("spare_parts").insert(payload);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/spare-parts");
  revalidatePath("/spare-parts");
}

export async function deleteSparePartAction(formData: FormData) {
  const supabase = await adminClient();
  const id = String(formData.get("id"));
  const { error } = await supabase.from("spare_parts").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/spare-parts");
  revalidatePath("/spare-parts");
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

  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
  const role = String(formData.get("role") ?? "technician") as ProfileRole;
  const technicianTypeRaw = String(formData.get("technician_type") ?? "").trim();
  const avatarFile = getAvatarFromFormData(formData);

  if (!fullName || fullName.length < 2) {
    throw new Error("أدخل الاسم الكامل.");
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

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName, phone },
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
      full_name: fullName,
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
