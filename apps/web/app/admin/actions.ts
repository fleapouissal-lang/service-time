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
import { createAuthServerClient, requireProfile, requireProfileOrThrow } from "@/lib/auth";
import { findAuthUserByEmail } from "@/lib/auth-users";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";
import { isQuotePending } from "@/lib/suggest-service-price";
import { isPaymentBlockingAssignment } from "@/lib/service-request-payment";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { resolveSparePartImagesFromForm } from "@/lib/spare-part-image";
import {
  getAvatarFromFormData,
  PROFILE_AVATAR_BUCKET,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";
import { getPlatformUserById } from "@/lib/admin-dashboard-data";
import { resolveQuickRequestClient } from "@/lib/quick-request-client";
import { notifyOrderCreated } from "@/lib/order-notifications";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";
import { saveClientVehicleAsAdmin } from "@/lib/client-vehicles";
import { resolveProfileNamesFromFields } from "@/lib/profile-names";
import { notifyAccountCreated } from "@/lib/account-welcome-notifications";
import { getLoginUrl } from "@/lib/quick-request-client";
import {
  contactValidationErrorMessageAr,
  isValidMobilePhone,
  validateRequiredContact,
} from "@/lib/contact-validation";
import {
  applyPlatformUserUpdate,
  parsePlatformUserUpdateInput,
  validatePlatformUserUpdateInput,
} from "@/lib/platform-user-update";
import { normalizePhone } from "@/lib/whatsapp-utils";
import {
  buildPhoneContactVerifyWhatsAppMessage,
  CONTACT_VERIFY_MAX_ATTEMPTS,
  CONTACT_VERIFY_TTL_MS,
  emailsEqual,
  generateContactVerifyCode,
  hashContactVerifyCode,
  isValidContactVerifyCode,
  phonesEqual,
} from "@/lib/platform-user-contact-verification";
import { sendContactChangeVerificationCode } from "@/lib/send-email";
import { sendWhatsAppMessage } from "@/lib/whatsapp-send";

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
  await requireProfileOrThrow(["admin"]);
  return await createAuthServerClient();
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
      .select(
        "client_proposed_price, quote_status, payment_method, payment_status, agreed_price",
      )
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

    if (existing && isPaymentBlockingAssignment(existing)) {
      if (assigned) {
        return { error: t.errors.servicePayment.assignBlocked };
      }
      if (
        status !== "received" &&
        status !== "cancelled"
      ) {
        return { error: t.errors.servicePayment.assignBlocked };
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
  await requireProfileOrThrow(["admin"]);
  const admin = getAdminSupabaseClient();
  if (!admin) throw new Error("إعدادات الخادم غير مكتملة.");

  const id = String(formData.get("id"));
  const { error } = await admin.from("service_requests").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  redirect("/admin/orders");
}

export async function deleteSparePartOrderAction(formData: FormData) {
  await requireProfileOrThrow(["admin"]);
  const admin = getAdminSupabaseClient();
  if (!admin) throw new Error("إعدادات الخادم غير مكتملة.");

  const id = String(formData.get("id") ?? "").trim();
  if (!id) throw new Error("معرّف الطلب مطلوب.");

  const { data: order, error: fetchError } = await admin
    .from("spare_part_orders")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);
  if (!order) throw new Error("الطلب غير موجود.");

  if (order.status !== "cancelled") {
    const { error: cancelError } = await admin
      .from("spare_part_orders")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (cancelError) throw new Error(cancelError.message);
  }

  const { error } = await admin.from("spare_part_orders").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/admin/spare-part-orders");
  revalidatePath(`/admin/spare-part-orders/${id}`);
  revalidatePath("/admin");
  revalidatePath("/admin/reports");
  revalidatePath("/client/spare-part-orders");
  revalidatePath("/spare-parts");
  redirect("/admin/spare-part-orders");
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

export async function deletePlatformUserAction(formData: FormData) {
  const currentAdmin = await requireProfileOrThrow(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("إعدادات الخادم غير مكتملة.");
  }

  const id = String(formData.get("id") ?? "").trim();
  if (!id) {
    throw new Error("معرّف المستخدم غير صالح.");
  }

  if (id === currentAdmin.id) {
    throw new Error("لا يمكنك حذف حسابك الحالي.");
  }

  const { data: target, error: fetchError } = await admin
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!target) {
    throw new Error("المستخدم غير موجود.");
  }

  if (target.role === "admin") {
    const { count, error: countError } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");

    if (countError) {
      throw new Error(countError.message);
    }

    if ((count ?? 0) <= 1) {
      throw new Error("لا يمكن حذف آخر مدير.");
    }
  }

  try {
    const { data: files } = await admin.storage
      .from(PROFILE_AVATAR_BUCKET)
      .list(id);

    if (files?.length) {
      await admin.storage
        .from(PROFILE_AVATAR_BUCKET)
        .remove(files.map((file) => `${id}/${file.name}`));
    }
  } catch {
    // Nettoyage avatar best-effort — la suppression auth reste prioritaire.
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    throw new Error(deleteError.message);
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export async function createPlatformUserAction(formData: FormData) {
  await requireProfileOrThrow(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("إعدادات الخادم غير مكتملة.");
  }

  const fullNameAr = String(formData.get("full_name_ar") ?? "").trim();
  const fullNameEn = String(formData.get("full_name_en") ?? "").trim();
  const emailRaw = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const phoneRaw = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "technician") as ProfileRole;
  const technicianTypeRaw = String(formData.get("technician_type") ?? "").trim();
  const avatarFile = getAvatarFromFormData(formData);

  if (fullNameAr.length < 2) {
    throw new Error("أدخل الاسم بالعربية.");
  }

  if (fullNameEn.length < 2) {
    throw new Error("أدخل الاسم بالإنجليزية.");
  }

  const contact = validateRequiredContact(emailRaw, phoneRaw);
  if (!contact.ok) {
    throw new Error(contactValidationErrorMessageAr(contact.error));
  }

  const email = contact.email;
  const phone = contact.phone;

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

  void notifyAccountCreated({
    fullName: localizedNames.full_name_ar || localizedNames.full_name,
    loginEmail: email,
    phone,
    password,
    source: "admin_created",
    loginUrl: getLoginUrl(),
  }).catch((err) => console.error("[admin/create-user] welcome notify:", err));

  revalidatePath("/admin/users");
  revalidatePath("/admin/technicians");
  revalidatePath("/admin");
}

export type PlatformUserEditData = {
  id: string;
  email: string;
  full_name_ar: string;
  full_name_en: string;
  phone: string | null;
  role: ProfileRole;
  technician_type: TechnicianType | null;
  avatar_url: string | null;
};

export async function getPlatformUserEditDataAction(
  userId: string,
): Promise<PlatformUserEditData | null> {
  await requireProfileOrThrow(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("إعدادات الخادم غير مكتملة.");
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, full_name_ar, full_name_en, phone, role, technician_type, avatar_url",
    )
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!profile) {
    return null;
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(userId);

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "المستخدم غير موجود.");
  }

  return {
    id: profile.id,
    email: authData.user.email ?? "",
    full_name_ar: profile.full_name_ar ?? profile.full_name,
    full_name_en: profile.full_name_en ?? profile.full_name,
    phone: profile.phone,
    role: profile.role as ProfileRole,
    technician_type: profile.technician_type as TechnicianType | null,
    avatar_url: profile.avatar_url,
  };
}

async function assertCanDemoteAdmin(
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  userId: string,
  nextRole: ProfileRole,
) {
  const { data: current, error: fetchError } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!current || current.role !== "admin" || nextRole === "admin") {
    return;
  }

  const { count, error: countError } = await admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) <= 1) {
    throw new Error("لا يمكن تغيير دور آخر مدير.");
  }
}

export type UpdatePlatformUserResult =
  | { status: "applied" }
  | {
      status: "verification_required";
      verificationId: string;
      emailChanged: boolean;
      phoneChanged: boolean;
    };

type ContactVerificationPayload = {
  full_name_ar: string;
  full_name_en: string;
  email: string;
  phone: string | null;
  role: ProfileRole;
  technician_type: TechnicianType | null;
};

type ContactVerificationRow = {
  id: string;
  user_id: string;
  admin_id: string;
  payload: ContactVerificationPayload;
  new_email: string | null;
  new_phone: string | null;
  old_email: string | null;
  old_phone: string | null;
  email_code_hash: string | null;
  phone_code_hash: string | null;
  email_attempts: number;
  phone_attempts: number;
  expires_at: string;
};

function revalidatePlatformUserPaths(userId: string) {
  revalidatePath("/admin/users");
  revalidatePath("/admin/technicians");
  revalidatePath(`/admin/users/${userId}`);
  revalidatePath("/admin");
}

async function confirmPlatformUserContactVerification(
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  currentAdminId: string,
  input: ReturnType<typeof parsePlatformUserUpdateInput>,
  verificationId: string,
  emailCode: string,
  phoneCode: string,
): Promise<UpdatePlatformUserResult> {
  const { data: row, error: fetchError } = await admin
    .from("platform_user_contact_verifications")
    .select("*")
    .eq("id", verificationId)
    .eq("user_id", input.id)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!row) {
    throw new Error("انتهت صلاحية التحقق. أعد المحاولة.");
  }

  const record = row as ContactVerificationRow;

  if (record.admin_id !== currentAdminId) {
    throw new Error("غير مصرح.");
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await admin
      .from("platform_user_contact_verifications")
      .delete()
      .eq("id", verificationId);
    throw new Error("انتهت صلاحية رمز التحقق. أعد المحاولة.");
  }

  const emailChanged = Boolean(record.email_code_hash);
  const phoneChanged = Boolean(record.phone_code_hash);

  if (emailChanged) {
    if (!isValidContactVerifyCode(emailCode)) {
      throw new Error("أدخل رمز البريد الإلكتروني (6 أرقام).");
    }

    const expectedEmail = record.new_email ?? input.email;
    const emailHash = hashContactVerifyCode("email", expectedEmail, emailCode);

    if (emailHash !== record.email_code_hash) {
      const nextAttempts = record.email_attempts + 1;
      if (nextAttempts >= CONTACT_VERIFY_MAX_ATTEMPTS) {
        await admin
          .from("platform_user_contact_verifications")
          .delete()
          .eq("id", verificationId);
        throw new Error("تجاوزت عدد محاولات رمز البريد. أعد المحاولة.");
      }

      await admin
        .from("platform_user_contact_verifications")
        .update({ email_attempts: nextAttempts })
        .eq("id", verificationId);
      throw new Error("رمز البريد الإلكتروني غير صحيح.");
    }
  }

  if (phoneChanged) {
    if (!isValidContactVerifyCode(phoneCode)) {
      throw new Error("أدخل رمز واتساب (6 أرقام).");
    }

    const phoneTarget = record.new_phone ?? record.old_phone ?? "";
    const phoneHash = hashContactVerifyCode("phone", phoneTarget, phoneCode);

    if (phoneHash !== record.phone_code_hash) {
      const nextAttempts = record.phone_attempts + 1;
      if (nextAttempts >= CONTACT_VERIFY_MAX_ATTEMPTS) {
        await admin
          .from("platform_user_contact_verifications")
          .delete()
          .eq("id", verificationId);
        throw new Error("تجاوزت عدد محاولات رمز واتساب. أعد المحاولة.");
      }

      await admin
        .from("platform_user_contact_verifications")
        .update({ phone_attempts: nextAttempts })
        .eq("id", verificationId);
      throw new Error("رمز واتساب غير صحيح.");
    }
  }

  await assertCanDemoteAdmin(admin, input.id, input.role);

  const existing = await findAuthUserByEmail(input.email);
  if (existing && existing.id !== input.id) {
    throw new Error("هذا البريد مستخدم بالفعل.");
  }

  await applyPlatformUserUpdate(admin, input);

  await admin
    .from("platform_user_contact_verifications")
    .delete()
    .eq("id", verificationId);

  revalidatePlatformUserPaths(input.id);
  return { status: "applied" };
}

async function initiatePlatformUserContactVerification(
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  currentAdminId: string,
  input: ReturnType<typeof parsePlatformUserUpdateInput>,
  oldEmail: string,
  oldPhone: string | null,
  emailChanged: boolean,
  phoneChanged: boolean,
): Promise<UpdatePlatformUserResult> {
  const emailVerifyCode = emailChanged ? generateContactVerifyCode() : null;
  const phoneVerifyCode = phoneChanged ? generateContactVerifyCode() : null;
  const phoneVerifyTarget = phoneChanged ? (input.phone ?? oldPhone) : null;

  if (phoneChanged && !phoneVerifyTarget) {
    throw new Error("لا يمكن التحقق من رقم الجوال.");
  }

  const payload: ContactVerificationPayload = {
    full_name_ar: input.fullNameAr,
    full_name_en: input.fullNameEn,
    email: input.email,
    phone: input.phone,
    role: input.role,
    technician_type: input.technicianType,
  };

  await admin
    .from("platform_user_contact_verifications")
    .delete()
    .eq("user_id", input.id);

  const { data: row, error: insertError } = await admin
    .from("platform_user_contact_verifications")
    .insert({
      user_id: input.id,
      admin_id: currentAdminId,
      payload,
      new_email: emailChanged ? input.email : null,
      new_phone: phoneChanged ? input.phone : null,
      old_email: oldEmail,
      old_phone: oldPhone,
      email_code_hash: emailVerifyCode
        ? hashContactVerifyCode("email", input.email, emailVerifyCode)
        : null,
      phone_code_hash:
        phoneVerifyCode && phoneVerifyTarget
          ? hashContactVerifyCode("phone", phoneVerifyTarget, phoneVerifyCode)
          : null,
      expires_at: new Date(Date.now() + CONTACT_VERIFY_TTL_MS).toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !row) {
    throw new Error(insertError?.message ?? "تعذّر بدء التحقق.");
  }

  if (emailChanged && emailVerifyCode) {
    const mail = await sendContactChangeVerificationCode(
      input.email,
      emailVerifyCode,
      input.fullNameAr,
    );
    if (!mail.ok) {
      await admin
        .from("platform_user_contact_verifications")
        .delete()
        .eq("id", row.id);
      throw new Error(mail.error ?? "تعذّر إرسال رمز البريد.");
    }
  }

  if (phoneChanged && phoneVerifyCode && phoneVerifyTarget) {
    const wa = await sendWhatsAppMessage(
      phoneVerifyTarget,
      buildPhoneContactVerifyWhatsAppMessage({
        fullName: input.fullNameAr,
        code: phoneVerifyCode,
      }),
    );
    if (!wa.ok) {
      await admin
        .from("platform_user_contact_verifications")
        .delete()
        .eq("id", row.id);
      throw new Error(wa.error ?? "تعذّر إرسال رمز واتساب.");
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[contact-verify]", {
      userId: input.id,
      emailCode: emailVerifyCode,
      phoneCode: phoneVerifyCode,
      phoneTarget: phoneVerifyTarget,
    });
  }

  return {
    status: "verification_required",
    verificationId: row.id,
    emailChanged,
    phoneChanged,
  };
}

export async function updatePlatformUserAction(
  formData: FormData,
): Promise<UpdatePlatformUserResult> {
  const currentAdmin = await requireProfileOrThrow(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("إعدادات الخادم غير مكتملة.");
  }

  const input = parsePlatformUserUpdateInput(formData);
  validatePlatformUserUpdateInput(input);

  const verificationId = String(formData.get("verification_id") ?? "").trim();
  const emailCode = String(formData.get("email_verification_code") ?? "").trim();
  const phoneCode = String(formData.get("phone_verification_code") ?? "").trim();

  if (verificationId) {
    return confirmPlatformUserContactVerification(
      admin,
      currentAdmin.id,
      input,
      verificationId,
      emailCode,
      phoneCode,
    );
  }

  const { data: authData, error: authError } =
    await admin.auth.admin.getUserById(input.id);

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "المستخدم غير موجود.");
  }

  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("phone")
    .eq("id", input.id)
    .maybeSingle();

  if (profileError) {
    throw new Error(profileError.message);
  }

  const oldEmail = authData.user.email ?? "";
  const oldPhone = profile?.phone ?? null;
  const emailChanged = !emailsEqual(oldEmail, input.email);
  const phoneChanged = !phonesEqual(oldPhone, input.phone);

  if (phoneChanged && input.phone && !isValidMobilePhone(input.phone)) {
    throw new Error(contactValidationErrorMessageAr("phone_invalid"));
  }

  await assertCanDemoteAdmin(admin, input.id, input.role);

  const existing = await findAuthUserByEmail(input.email);
  if (existing && existing.id !== input.id) {
    throw new Error("هذا البريد مستخدم بالفعل.");
  }

  if (!emailChanged && !phoneChanged) {
    await applyPlatformUserUpdate(admin, input);
    revalidatePlatformUserPaths(input.id);
    return { status: "applied" };
  }

  return initiatePlatformUserContactVerification(
    admin,
    currentAdmin.id,
    input,
    oldEmail,
    oldPhone,
    emailChanged,
    phoneChanged,
  );
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
  await requireProfileOrThrow(["admin"]);
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

  const t = getDictionary(await getLocale());
  const cp = t.dashboard.admin.ordersPage.createOrderPayment;

  const priceRaw = String(formData.get("agreed_price") ?? "").trim();
  const agreedPrice = priceRaw ? Number(priceRaw) : NaN;
  if (!Number.isFinite(agreedPrice) || agreedPrice <= 0) {
    return { error: cp.priceRequired };
  }

  const paymentMethodRaw = String(formData.get("payment_method") ?? "cash_on_delivery");
  const paymentMethod =
    paymentMethodRaw === "online" ? "online" : "cash_on_delivery";
  const paymentReference = String(formData.get("payment_reference") ?? "").trim();

  if (paymentMethod === "online" && !paymentReference) {
    return { error: cp.paymentReferenceRequired };
  }

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
      client_proposed_price: agreedPrice,
      agreed_price: agreedPrice,
      quote_status: "accepted",
      payment_method: paymentMethod,
      payment_status: paymentMethod === "online" ? "paid" : "pending",
      payment_reference: paymentMethod === "online" ? paymentReference : null,
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
