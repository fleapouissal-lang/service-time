"use server";

import { revalidatePath } from "next/cache";
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
import { parseSparePartCondition } from "@/lib/spare-part-condition";
import { parseSparePartOriginalPrice } from "@/lib/spare-part-promotion";
import { parseSparePartVehicleFields } from "@/lib/spare-part-vehicle";
import {
  getAvatarFromFormData,
  PROFILE_AVATAR_BUCKET,
  uploadProfileAvatar,
} from "@/lib/upload-profile-avatar";
import { getPlatformUserById } from "@/lib/admin-dashboard-data";
import { resolveQuickRequestClient } from "@/lib/quick-request-client";
import { deleteClientRelatedData } from "@/lib/delete-client-related-data";
import { notifyOrderCreated, notifyOrderStatusUpdated } from "@/lib/order-notifications";
import { revalidateServiceRequestDashboards } from "@/lib/revalidate-service-request-paths";
import { saveClientVehicleAsAdmin } from "@/lib/client-vehicles";
import { resolveOrderStatusOnAdminUpdate } from "@/lib/service-request-status";
import { isStrongEnoughPassword, PASSWORD_REQUIREMENTS_AR } from "@/lib/password-policy";
import {
  getWorkshopBranchesAdmin,
  parseWorkshopBranchFromForm,
  persistWorkshopBranches,
  validateWorkshopBranch,
  workshopValidationMessage,
} from "@/lib/workshop-locations-admin";
import {
  getIndustrialZonesAdmin,
  industrialValidationMessage,
  parseIndustrialZoneFromForm,
  persistIndustrialZones,
  validateIndustrialZone,
} from "@/lib/industrial-zones-admin";
import {
  getAdminServicesCatalog,
  parseCategoryFromForm,
  persistAdminServicesCatalog,
} from "@/lib/services-catalog-admin";
import {
  getAdminHeroBanners,
  parseHeroBannerFromForm,
  persistHeroBanners,
  validateHeroBanner,
  type AdminHeroBanner,
} from "@/lib/hero-banners";
import { resolveHeroBannerImagesFromForm } from "@/lib/hero-banner-image";
import {
  getAdminFooterContent,
  getFooterLinkGroup,
  parseFooterContentFromForm,
  parseFooterLinkFromForm,
  persistFooterContent,
  validateFooterContent,
  validateFooterLink,
  withFooterLinkGroup,
  type FooterLinkGroup,
} from "@/lib/footer-content-admin";
import {
  getAdminLegalPages,
  parseLegalPageFromForm,
  persistLegalPages,
  validateLegalPage,
  type AdminLegalPage,
} from "@/lib/legal-pages-admin";
import {
  getAdminWhatsAppFloatSettings,
  parseWhatsAppFloatFromForm,
  persistWhatsAppFloatSettings,
  validateWhatsAppFloatSettings,
} from "@/lib/whatsapp-float-admin";
import {
  getAdminVehicleClasses,
  parseVehicleClassFromForm,
  persistVehicleClasses,
  validateVehicleClass,
} from "@/lib/vehicle-classes-admin";
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
  matchesContactVerifyCodeHash,
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
  const destinationText =
    String(formData.get("destination_text") ?? "").trim() || null;
  const destLatRaw = String(formData.get("destination_lat") ?? "").trim();
  const destLngRaw = String(formData.get("destination_lng") ?? "").trim();
  const destLat = destLatRaw ? Number(destLatRaw) : null;
  const destLng = destLngRaw ? Number(destLngRaw) : null;

  return {
    location_text: locationText,
    location_lat:
      lat !== null && Number.isFinite(lat) ? lat : null,
    location_lng:
      lng !== null && Number.isFinite(lng) ? lng : null,
    destination_text: destinationText,
    destination_lat:
      destLat !== null && Number.isFinite(destLat) ? destLat : null,
    destination_lng:
      destLng !== null && Number.isFinite(destLng) ? destLng : null,
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
    const locale = await getLocale();
    const t = getDictionary(locale);
    const supabase = await adminClient();
    const id = String(formData.get("id"));
    const status = String(formData.get("status")) as ServiceRequestStatus;
    const priority = String(formData.get("priority")) as RequestPriority;
    const assigned = String(formData.get("assigned_technician_id") ?? "");
    const assignedTechnicianId = assigned || null;
    const location = parseOrderLocation(formData);

    const { data: existing } = await supabase
      .from("service_requests")
      .select(
        "status, customer_name, customer_phone, tracking_token, client_id, service_type, client_proposed_price, quote_status, payment_method, payment_status, agreed_price",
      )
      .eq("id", id)
      .maybeSingle();

    if (existing && isQuotePending(existing)) {
      if (assignedTechnicianId) {
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
      if (assignedTechnicianId) {
        return { error: t.errors.servicePayment.assignBlocked };
      }
      if (
        status !== "received" &&
        status !== "cancelled"
      ) {
        return { error: t.errors.servicePayment.assignBlocked };
      }
    }

    const finalStatus = resolveOrderStatusOnAdminUpdate(
      status,
      assignedTechnicianId,
    );

    const { error } = await supabase
      .from("service_requests")
      .update({
        status: finalStatus,
        priority,
        assigned_technician_id: assignedTechnicianId,
        ...location,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    if (existing && existing.status !== finalStatus) {
      const statusLabel =
        t.labels.status[
          finalStatus as keyof typeof t.labels.status
        ] ?? finalStatus;
      const serviceTypeLabel =
        existing.service_type &&
        t.labels.serviceType[
          existing.service_type as keyof typeof t.labels.serviceType
        ]
          ? t.labels.serviceType[
              existing.service_type as keyof typeof t.labels.serviceType
            ]
          : undefined;

      void notifyOrderStatusUpdated({
        requestId: id,
        customerName: existing.customer_name,
        customerPhone: existing.customer_phone,
        clientId: existing.client_id,
        trackingToken: existing.tracking_token,
        statusLabel,
        serviceTypeLabel,
      }).catch((err) => console.error("[admin/update-order] status notify:", err));
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${id}`);
    revalidatePath("/admin/invoices");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function deleteAdminOrderAction(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireProfileOrThrow(["admin"]);
    const admin = getAdminSupabaseClient();
    if (!admin) return { error: "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©." };

    const id = String(formData.get("id"));
    const { error } = await admin.from("service_requests").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "ØªØ¹Ø°Ù‘Ø± Ø­Ø°Ù Ø§Ù„Ø·Ù„Ø¨." };
  }
}

export async function deleteSparePartOrderAction(
  formData: FormData,
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireProfileOrThrow(["admin"]);
    const admin = getAdminSupabaseClient();
    if (!admin) return { error: "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©." };

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Ù…Ø¹Ø±Ù‘Ù Ø§Ù„Ø·Ù„Ø¨ Ù…Ø·Ù„ÙˆØ¨." };

    const { data: order, error: fetchError } = await admin
      .from("spare_part_orders")
      .select("status")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!order) return { error: "Ø§Ù„Ø·Ù„Ø¨ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯." };

    if (order.status !== "cancelled") {
      const { error: cancelError } = await admin
        .from("spare_part_orders")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (cancelError) return { error: cancelError.message };
    }

    const { error } = await admin.from("spare_part_orders").delete().eq("id", id);
    if (error) return { error: error.message };

    revalidatePath("/admin/spare-part-orders");
    revalidatePath(`/admin/spare-part-orders/${id}`);
    revalidatePath("/admin");
    revalidatePath("/admin/reports");
    revalidatePath("/client/spare-part-orders");
    revalidatePath("/spare-parts");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "ØªØ¹Ø°Ù‘Ø± Ø­Ø°Ù Ø§Ù„Ø·Ù„Ø¨." };
  }
}

export type SaveSparePartFormState = {
  success?: boolean;
  error?: string;
  id?: string;
};

function sparePartPayloadFromForm(formData: FormData, images: string[]) {
  const img = images[0] ?? null;
  const priceRaw = String(formData.get("price") ?? "0").trim();
  const price = Math.max(0, Number.parseFloat(priceRaw) || 0);
  const stockRaw = String(formData.get("stock_quantity") ?? "0").trim();
  const stock_quantity = Math.max(0, Number.parseInt(stockRaw, 10) || 0);
  const original_price = parseSparePartOriginalPrice(
    formData.get("original_price"),
    price,
  );
  const vehicle = parseSparePartVehicleFields(formData);

  return {
    vehicle,
    payload: {
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
      original_price,
      stock_quantity,
      part_condition: parseSparePartCondition(formData.get("part_condition")),
      vehicle_brand_slug: vehicle.vehicle_brand_slug,
      vehicle_model_id: vehicle.vehicle_model_id,
      is_active: formData.get("is_active") === "on",
    },
  };
}

export async function saveSparePartAction(
  _prev: SaveSparePartFormState,
  formData: FormData,
): Promise<SaveSparePartFormState> {
  try {
    const supabase = await adminClient();
    const images = await resolveSparePartImagesFromForm(formData);
    const { vehicle, payload } = sparePartPayloadFromForm(formData, images);

    if (!vehicle.vehicle_brand_slug || !vehicle.vehicle_model_id) {
      return { error: "Select vehicle brand and model for this part" };
    }

    const { data, error } = await supabase
      .from("spare_parts")
      .insert(payload)
      .select("id")
      .single();

    if (error) return { error: error.message };
    if (!data?.id) return { error: "Failed to create spare part" };

    revalidatePath("/admin/spare-parts");
    revalidatePath("/spare-parts");
    return { success: true, id: data.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function saveSparePartEditAction(
  _prev: SaveSparePartFormState,
  formData: FormData,
): Promise<SaveSparePartFormState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "");
    if (!id) return { error: "Missing part id" };

    const images = await resolveSparePartImagesFromForm(formData);
    const { vehicle, payload } = sparePartPayloadFromForm(formData, images);

    if (!vehicle.vehicle_brand_slug || !vehicle.vehicle_model_id) {
      return { error: "Select vehicle brand and model for this part" };
    }

    const { error } = await supabase
      .from("spare_parts")
      .update(payload)
      .eq("id", id);

    if (error) return { error: error.message };

    revalidatePath("/admin/spare-parts");
    revalidatePath(`/admin/spare-parts/${id}`);
    revalidatePath("/spare-parts");
    return { success: true, id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type DeleteSparePartFormState = {
  success?: boolean;
  error?: string;
};

export async function deleteSparePartAction(
  _prev: DeleteSparePartFormState,
  formData: FormData,
): Promise<DeleteSparePartFormState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing part id" };

    const { error } = await supabase.from("spare_parts").delete().eq("id", id);
    if (error) {
      if (error.code === "23503" || /foreign key|restrict/i.test(error.message)) {
        const t = getDictionary(await getLocale());
        return { error: t.dashboard.admin.sparePartsPage.deleteInUseError };
      }
      return { error: error.message };
    }

    revalidatePath("/admin/spare-parts");
    revalidatePath("/spare-parts");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type MutationFormState = {
  success?: boolean;
  error?: string;
};

export async function saveContentAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const supabase = await adminClient();
    const key = String(formData.get("key"));
    const valueRaw = String(formData.get("value_json"));

    let value: Record<string, unknown>;
    try {
      value = JSON.parse(valueRaw) as Record<string, unknown>;
    } catch {
      return { error: "JSON ØºÙŠØ± ØµØ§Ù„Ø­" };
    }

    const { error } = await supabase.from("site_content").upsert({ key, value });
    if (error) return { error: error.message };

    revalidatePath("/admin/content");
    return { success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "ØªØ¹Ø°Ù‘Ø± Ø§Ù„Ø­ÙØ¸." };
  }
}

function revalidateWorkshopLocationPaths() {
  revalidatePath("/admin/locations");
  revalidatePath("/locations");
  revalidatePath("/");
  revalidatePath("/request");
  revalidatePath("/client/request");
  revalidatePath("/services");
}

export async function saveWorkshopLocationAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.locationsPage;
    const supabase = await adminClient();

    const existingId = String(formData.get("id") ?? "").trim();
    const branch = parseWorkshopBranchFromForm(
      formData,
      existingId || undefined,
    );
    const issue = validateWorkshopBranch(branch);
    if (issue) {
      return {
        error: workshopValidationMessage(issue, {
          nameArRequired: p.nameArRequired,
          addressArRequired: p.addressArRequired,
          coordsInvalid: p.coordsInvalid,
          minOneRequired: p.minOneRequired,
        }),
      };
    }

    const branches = await getWorkshopBranchesAdmin();
    const index = branches.findIndex((item) => item.id === branch.id);

    if (index >= 0) {
      branches[index] = branch;
    } else {
      branches.push(branch);
    }

    await persistWorkshopBranches(supabase, branches);
    revalidateWorkshopLocationPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    return {
      error:
        err instanceof Error
          ? err.message
          : t.dashboard.admin.locationsPage.saveFailed,
    };
  }
}

export async function deleteWorkshopLocationAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.locationsPage;
    const supabase = await adminClient();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.deleteFailed };

    const branches = await getWorkshopBranchesAdmin();
    if (branches.length <= 1) return { error: p.minOneRequired };

    const next = branches.filter((branch) => branch.id !== id);
    if (next.length === branches.length) return { error: p.notFound };

    await persistWorkshopBranches(supabase, next);
    revalidateWorkshopLocationPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    return {
      error:
        err instanceof Error
          ? err.message
          : t.dashboard.admin.locationsPage.deleteFailed,
    };
  }
}

export async function saveIndustrialZoneAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.locationsPage.industrial;
    const supabase = await adminClient();

    const existingId = String(formData.get("id") ?? "").trim();
    const zone = parseIndustrialZoneFromForm(
      formData,
      existingId || undefined,
    );
    const issue = validateIndustrialZone(zone);
    if (issue) {
      return {
        error: industrialValidationMessage(issue, {
          nameArRequired: p.nameArRequired,
          addressArRequired: p.addressArRequired,
          coordsInvalid: p.coordsInvalid,
        }),
      };
    }

    const zones = await getIndustrialZonesAdmin();
    const index = zones.findIndex((item) => item.id === zone.id);

    if (index >= 0) {
      zones[index] = zone;
    } else {
      zones.push(zone);
    }

    await persistIndustrialZones(supabase, zones);
    revalidateWorkshopLocationPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    return {
      error:
        err instanceof Error
          ? err.message
          : t.dashboard.admin.locationsPage.industrial.saveFailed,
    };
  }
}

export async function deleteIndustrialZoneAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.locationsPage.industrial;
    const supabase = await adminClient();

    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.deleteFailed };

    const zones = await getIndustrialZonesAdmin();
    const next = zones.filter((zone) => zone.id !== id);
    if (next.length === zones.length) return { error: p.notFound };

    await persistIndustrialZones(supabase, next);
    revalidateWorkshopLocationPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    return {
      error:
        err instanceof Error
          ? err.message
          : t.dashboard.admin.locationsPage.industrial.deleteFailed,
    };
  }
}

export async function togglePlatformUserAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const supabase = await adminClient();
    const id = String(formData.get("id"));
    const is_active = formData.get("is_active") === "true";

    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !is_active })
      .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/admin/users");
    revalidatePath("/admin/technicians");
    revalidatePath(`/admin/users/${id}`);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "ØªØ¹Ø°Ù‘Ø± ØªØ­Ø¯ÙŠØ« Ø§Ù„Ø­Ø§Ù„Ø©.",
    };
  }
}

/** @deprecated Utiliser togglePlatformUserAction */
export async function toggleTechnicianAction(
  prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  return togglePlatformUserAction(prev, formData);
}

export async function deletePlatformUserAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    const currentAdmin = await requireProfileOrThrow(["admin"]);

    const admin = getAdminSupabaseClient();
    if (!admin) {
      return { error: "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©." };
    }

    const id = String(formData.get("id") ?? "").trim();
    if (!id) {
      return { error: "Ù…Ø¹Ø±Ù‘Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± ØµØ§Ù„Ø­." };
    }

    if (id === currentAdmin.id) {
      return { error: "Ù„Ø§ ÙŠÙ…ÙƒÙ†Ùƒ Ø­Ø°Ù Ø­Ø³Ø§Ø¨Ùƒ Ø§Ù„Ø­Ø§Ù„ÙŠ." };
    }

    const { data: target, error: fetchError } = await admin
      .from("profiles")
      .select("id, role, full_name, phone, is_super_admin")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!target) return { error: "المستخدم غير موجود." };

    if (target.is_super_admin) {
      return { error: "لا يمكن حذف حساب Super Admin." };
    }

    if (target.role === "admin") {
      const { count, error: countError } = await admin
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("role", "admin");

      if (countError) return { error: countError.message };
      if ((count ?? 0) <= 1) return { error: "لا يمكن حذف آخر مدير." };
    }

    if (target.role === "client") {
      const { data: authUserData, error: authUserError } =
        await admin.auth.admin.getUserById(id);

      if (authUserError) return { error: authUserError.message };

      await deleteClientRelatedData(
        admin,
        id,
        target.phone,
        authUserData.user?.email ?? null,
      );
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
      // Nettoyage avatar best-effort â€” la suppression auth reste prioritaire.
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(id);
    if (deleteError) return { error: deleteError.message };

    revalidatePath("/admin/users");
    revalidatePath("/admin/technicians");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/spare-part-orders");
    revalidatePath("/admin/reports");
    revalidatePath("/admin");
    revalidatePath("/client/orders");
    revalidatePath("/client/spare-part-orders");
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "ØªØ¹Ø°Ù‘Ø± Ø­Ø°Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù….",
    };
  }
}

export async function createPlatformUserAction(formData: FormData) {
  await requireProfileOrThrow(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©.");
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
    throw new Error("Ø£Ø¯Ø®Ù„ Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©.");
  }

  if (fullNameEn.length < 2) {
    throw new Error("Ø£Ø¯Ø®Ù„ Ø§Ù„Ø§Ø³Ù… Ø¨Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ©.");
  }

  const contact = validateRequiredContact(emailRaw, phoneRaw);
  if (!contact.ok) {
    throw new Error(contactValidationErrorMessageAr(contact.error));
  }

  const email = contact.email;
  const phone = contact.phone;

  if (!isStrongEnoughPassword(password)) {
    throw new Error(PASSWORD_REQUIREMENTS_AR);
  }

  if (!["client", "technician", "admin"].includes(role)) {
    throw new Error("Ù†ÙˆØ¹ Ø§Ù„Ø­Ø³Ø§Ø¨ ØºÙŠØ± ØµØ§Ù„Ø­.");
  }

  let technicianType: TechnicianType | null = null;
  if (role === "technician") {
    if (technicianTypeRaw !== "mobile" && technicianTypeRaw !== "workshop") {
      throw new Error("Ø§Ø®ØªØ± Ù†ÙˆØ¹ Ø§Ù„ÙÙ†ÙŠ.");
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
    throw new Error(createError?.message ?? "ØªØ¹Ø°Ù‘Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨.");
  }

  const userId = created.user.id;
  let avatarUrl: string | null = null;
  let avatarStoragePath: string | null = null;

  if (avatarFile) {
    const uploaded = await uploadProfileAvatar(userId, avatarFile);
    if ("error" in uploaded) {
      await admin.auth.admin.deleteUser(userId);
      throw new Error(uploaded.error);
    }
    avatarUrl = uploaded.publicUrl;
    avatarStoragePath = uploaded.storagePath;
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
      avatar_storage_path: avatarStoragePath,
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
  updated_at: string;
};

export async function getPlatformUserEditDataAction(
  userId: string,
): Promise<PlatformUserEditData | null> {
  await requireProfileOrThrow(["admin"]);

  const admin = getAdminSupabaseClient();
  if (!admin) {
    throw new Error("Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©.");
  }

  const { data: profile, error } = await admin
    .from("profiles")
    .select(
      "id, full_name, full_name_ar, full_name_en, phone, role, technician_type, avatar_url, updated_at",
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
    throw new Error(authError?.message ?? "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯.");
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
    updated_at: profile.updated_at,
  };
}

async function assertCanDemoteAdmin(
  admin: NonNullable<ReturnType<typeof getAdminSupabaseClient>>,
  userId: string,
  nextRole: ProfileRole,
) {
  const { data: current, error: fetchError } = await admin
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", userId)
    .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!current || current.role !== "admin" || nextRole === "admin") {
    return;
  }

  if (current.is_super_admin) {
    throw new Error("لا يمكن تغيير دور حساب Super Admin.");
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
    throw new Error("Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØ© Ø§Ù„ØªØ­Ù‚Ù‚. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const record = row as ContactVerificationRow;

  if (record.admin_id !== currentAdminId) {
    throw new Error("ØºÙŠØ± Ù…ØµØ±Ø­.");
  }

  if (new Date(record.expires_at).getTime() < Date.now()) {
    await admin
      .from("platform_user_contact_verifications")
      .delete()
      .eq("id", verificationId);
    throw new Error("Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØ© Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
  }

  const emailChanged = Boolean(record.email_code_hash);
  const phoneChanged = Boolean(record.phone_code_hash);

  if (emailChanged) {
    if (!isValidContactVerifyCode(emailCode)) {
      throw new Error("Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ (6 Ø£Ø±Ù‚Ø§Ù…).");
    }

    const expectedEmail = record.new_email ?? input.email;

    if (
      !record.email_code_hash ||
      !matchesContactVerifyCodeHash(
        record.email_code_hash,
        "email",
        expectedEmail,
        emailCode,
      )
    ) {
      const nextAttempts = record.email_attempts + 1;
      if (nextAttempts >= CONTACT_VERIFY_MAX_ATTEMPTS) {
        await admin
          .from("platform_user_contact_verifications")
          .delete()
          .eq("id", verificationId);
        throw new Error("ØªØ¬Ø§ÙˆØ²Øª Ø¹Ø¯Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
      }

      await admin
        .from("platform_user_contact_verifications")
        .update({ email_attempts: nextAttempts })
        .eq("id", verificationId);
      throw new Error("Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­.");
    }
  }

  if (phoneChanged) {
    if (!isValidContactVerifyCode(phoneCode)) {
      throw new Error("Ø£Ø¯Ø®Ù„ Ø±Ù…Ø² ÙˆØ§ØªØ³Ø§Ø¨ (6 Ø£Ø±Ù‚Ø§Ù…).");
    }

    const phoneTarget = record.new_phone ?? record.old_phone ?? "";

    if (
      !record.phone_code_hash ||
      !matchesContactVerifyCodeHash(
        record.phone_code_hash,
        "phone",
        phoneTarget,
        phoneCode,
      )
    ) {
      const nextAttempts = record.phone_attempts + 1;
      if (nextAttempts >= CONTACT_VERIFY_MAX_ATTEMPTS) {
        await admin
          .from("platform_user_contact_verifications")
          .delete()
          .eq("id", verificationId);
        throw new Error("ØªØ¬Ø§ÙˆØ²Øª Ø¹Ø¯Ø¯ Ù…Ø­Ø§ÙˆÙ„Ø§Øª Ø±Ù…Ø² ÙˆØ§ØªØ³Ø§Ø¨. Ø£Ø¹Ø¯ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø©.");
      }

      await admin
        .from("platform_user_contact_verifications")
        .update({ phone_attempts: nextAttempts })
        .eq("id", verificationId);
      throw new Error("Ø±Ù…Ø² ÙˆØ§ØªØ³Ø§Ø¨ ØºÙŠØ± ØµØ­ÙŠØ­.");
    }
  }

  await assertCanDemoteAdmin(admin, input.id, input.role);

  const existing = await findAuthUserByEmail(input.email);
  if (existing && existing.id !== input.id) {
    throw new Error("Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø§Ù„ÙØ¹Ù„.");
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
    throw new Error("Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø±Ù‚Ù… Ø§Ù„Ø¬ÙˆØ§Ù„.");
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
    throw new Error(insertError?.message ?? "ØªØ¹Ø°Ù‘Ø± Ø¨Ø¯Ø¡ Ø§Ù„ØªØ­Ù‚Ù‚.");
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
      throw new Error(mail.error ?? "ØªØ¹Ø°Ù‘Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² Ø§Ù„Ø¨Ø±ÙŠØ¯.");
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
      throw new Error(wa.error ?? "ØªØ¹Ø°Ù‘Ø± Ø¥Ø±Ø³Ø§Ù„ Ø±Ù…Ø² ÙˆØ§ØªØ³Ø§Ø¨.");
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
    throw new Error("Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©.");
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
    throw new Error(authError?.message ?? "Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯.");
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
    throw new Error("Ù‡Ø°Ø§ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ù…Ø³ØªØ®Ø¯Ù… Ø¨Ø§Ù„ÙØ¹Ù„.");
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
      return "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ Ù…Ø³ØªØ®Ø¯Ù… Ù„Ø­Ø³Ø§Ø¨ ØºÙŠØ± Ø¹Ù…ÙŠÙ„.";
    case "create_user_failed":
      return "ØªØ¹Ø°Ù‘Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨ Ø§Ù„Ø¹Ù…ÙŠÙ„.";
    case "create_profile_failed":
      return "ØªØ¹Ø°Ù‘Ø± Ø¥Ù†Ø´Ø§Ø¡ Ù…Ù„Ù Ø§Ù„Ø¹Ù…ÙŠÙ„.";
    case "server_incomplete":
      return "Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø§Ø¯Ù… ØºÙŠØ± Ù…ÙƒØªÙ…Ù„Ø©.";
    default:
      return "ØªØ¹Ø°Ù‘Ø± Ø¥Ø¹Ø¯Ø§Ø¯ Ø§Ù„Ø¹Ù…ÙŠÙ„.";
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
      return { error: "Ø£Ø¯Ø®Ù„ Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„." };
    }
    if (!phoneRaw) {
      return { error: "Ø±Ù‚Ù… Ù‡Ø§ØªÙ Ø§Ù„Ø¹Ù…ÙŠÙ„ Ù…Ø·Ù„ÙˆØ¨." };
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
      return { error: "Ø§Ø®ØªØ± Ø¹Ù…ÙŠÙ„Ø§Ù‹ Ù…Ø³Ø¬Ù‘Ù„Ø§Ù‹." };
    }

    const client = await getPlatformUserById(clientId);
    if (!client || client.role !== "client") {
      return { error: "Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­Ø¯Ø¯ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯." };
    }
    if (!client.phone?.trim()) {
      return { error: "Ø§Ù„Ø¹Ù…ÙŠÙ„ Ø§Ù„Ù…Ø­Ø¯Ø¯ Ù„Ø§ ÙŠÙ…Ù„Ùƒ Ø±Ù‚Ù… Ù‡Ø§ØªÙ." };
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
    return { error: "Ù†ÙˆØ¹ Ø§Ù„Ø®Ø¯Ù…Ø© ØºÙŠØ± ØµØ§Ù„Ø­." };
  }
  if (!ADMIN_ORDER_EXECUTION_METHODS.includes(executionMethod)) {
    return { error: "Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„ØªÙ†ÙÙŠØ° ØºÙŠØ± ØµØ§Ù„Ø­Ø©." };
  }
  if (!ADMIN_ORDER_PRIORITIES.includes(priority)) {
    return { error: "Ø§Ù„Ø£ÙˆÙ„ÙˆÙŠØ© ØºÙŠØ± ØµØ§Ù„Ø­Ø©." };
  }

  const carType = String(formData.get("car_type") ?? "").trim() || null;
  const vehicleClassRaw = String(formData.get("vehicle_class") ?? "").trim();
  const catalogCategory =
    String(formData.get("catalog_category") ?? "").trim() || null;
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
      return { error: "Ø§Ù„ÙÙ†ÙŠ Ø§Ù„Ù…Ø­Ø¯Ø¯ ØºÙŠØ± ØµØ§Ù„Ø­." };
    }
  }

  const { data, error } = await admin
    .from("service_requests")
    .insert({
      client_id: clientId,
      customer_name: customerName,
      customer_phone: customerPhone,
      car_type: carType,
      catalog_category: catalogCategory,
      location_text: location.location_text,
      location_lat: location.location_lat,
      location_lng: location.location_lng,
      description,
      service_type: serviceType,
      execution_method: executionMethod,
      status: assignedTechnicianId ? "assigned" : "received",
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
    return { error: error?.message ?? "ØªØ¹Ø°Ù‘Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø·Ù„Ø¨." };
  }

  if (carType) {
    await saveClientVehicleAsAdmin(clientId, carType, vehicleClassRaw || null);
  }

  revalidateServiceRequestDashboards();

  return { success: true };
}

function revalidateServicesCatalogPaths() {
  revalidatePath("/admin/services");
  revalidatePath("/services");
  revalidatePath("/request");
  revalidatePath("/");
  revalidatePath("/client/request");
}

export type SaveAdminServiceFormState = {
  success?: boolean;
  error?: string;
  id?: string;
};

export async function saveAdminServiceCategoryAction(
  _prev: SaveAdminServiceFormState,
  formData: FormData,
): Promise<SaveAdminServiceFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const arMessages = getDictionary("ar");
    const enMessages = getDictionary("en");
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.servicesPage;

    const catalog = await getAdminServicesCatalog(
      arMessages.services.catalog,
      enMessages.services.catalog,
    );

    const existingId = String(formData.get("id") ?? "").trim();
    const existing = existingId
      ? catalog.find((item) => item.id === existingId) ?? null
      : null;

    let category = parseCategoryFromForm(formData, existing);
    if (category.title_ar.length < 2) {
      return { error: p.nameArRequired };
    }
    if (category.subOptions.length < 1) {
      return { error: p.subRequired };
    }
    if (category.subOptions.some((sub) => sub.label_ar.trim().length < 2)) {
      return { error: p.subLabelRequired };
    }

    const seen = new Set<string>();
    category = {
      ...category,
      subOptions: category.subOptions.map((sub) => {
        let id = sub.id;
        while (seen.has(id)) id = `${id}_${crypto.randomUUID().slice(0, 4)}`;
        seen.add(id);
        return { ...sub, id };
      }),
    };

    if (!existing) {
      const taken = new Set(catalog.map((item) => item.id));
      let uniqueId = category.id;
      let suffix = 2;
      while (taken.has(uniqueId)) {
        uniqueId = `${category.id}_${suffix}`;
        suffix += 1;
      }
      category = { ...category, id: uniqueId };
    }

    const nextCatalog = existing
      ? catalog.map((item) =>
          item.id === existing.id
            ? { ...category, sort_order: existing.sort_order }
            : item,
        )
      : [...catalog, { ...category, sort_order: catalog.length }];

    await persistAdminServicesCatalog(supabase, nextCatalog);
    revalidateServicesCatalogPaths();
    return { success: true, id: category.id };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.servicesPage;
    const message = err instanceof Error ? err.message : "";
    if (message === "services_catalog_title_ar_required") {
      return { error: p.nameArRequired };
    }
    if (message === "services_catalog_sub_label_ar_required") {
      return { error: p.subLabelRequired };
    }
    return { error: message || p.saveError };
  }
}

export async function deleteAdminServiceCategoryAction(
  _prev: SaveAdminServiceFormState,
  formData: FormData,
): Promise<SaveAdminServiceFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: "Missing service id" };

    const arMessages = getDictionary("ar");
    const enMessages = getDictionary("en");
    const catalog = await getAdminServicesCatalog(
      arMessages.services.catalog,
      enMessages.services.catalog,
    );

    const next = catalog.filter((item) => item.id !== id);
    if (next.length === catalog.length) return { error: "Service not found" };

    await persistAdminServicesCatalog(supabase, next);
    revalidateServicesCatalogPaths();
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Could not delete service",
    };
  }
}

function revalidateHeroBannerPaths() {
  revalidatePath("/");
  revalidatePath("/admin/banners");
}

function heroBannerErrorMessage(code: string, p: {
  hrefInvalid: string;
  desktopImageRequired: string;
  mobileImageRequired: string;
  saveError: string;
}): string {
  if (code === "href_invalid") return p.hrefInvalid;
  if (code === "desktop_image_required") return p.desktopImageRequired;
  if (code === "mobile_image_required") return p.mobileImageRequired;
  return code || p.saveError;
}

export async function saveHeroBannerAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;

    const banners = await getAdminHeroBanners();
    const existingId = String(formData.get("id") ?? "").trim();
    const existing = existingId
      ? banners.find((item) => item.id === existingId) ?? null
      : null;

    const images = await resolveHeroBannerImagesFromForm(formData, existing);
    const banner = {
      ...parseHeroBannerFromForm(formData, existing),
      ...images,
    };

    const issue = validateHeroBanner(banner);
    if (issue) return { error: heroBannerErrorMessage(issue, p) };

    let next: AdminHeroBanner[];
    if (existing) {
      next = banners.map((item) => (item.id === existing.id ? banner : item));
    } else {
      next = [
        ...banners,
        {
          ...banner,
          sort_order:
            Number.isFinite(banner.sort_order) && banner.sort_order > 0
              ? banner.sort_order
              : banners.length,
        },
      ];
    }

    await persistHeroBanners(supabase, next);
    revalidateHeroBannerPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function deleteHeroBannerAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.notFound };

    const banners = await getAdminHeroBanners();
    const next = banners.filter((item) => item.id !== id);
    if (next.length === banners.length) return { error: p.notFound };
    if (next.length < 1) return { error: p.minOneRequired };

    await persistHeroBanners(supabase, next);
    revalidateHeroBannerPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    return {
      error: err instanceof Error ? err.message : p.deleteFailed,
    };
  }
}

export async function toggleHeroBannerAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.notFound };

    const banners = await getAdminHeroBanners();
    const target = banners.find((item) => item.id === id);
    if (!target) return { error: p.notFound };

    const next = banners.map((item) =>
      item.id === id ? { ...item, is_active: !item.is_active } : item,
    );

    await persistHeroBanners(supabase, next);
    revalidateHeroBannerPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function moveHeroBannerAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    const id = String(formData.get("id") ?? "").trim();
    const direction = String(formData.get("direction") ?? "").trim();
    if (!id || (direction !== "up" && direction !== "down")) {
      return { error: p.notFound };
    }

    const banners = [...(await getAdminHeroBanners())].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const index = banners.findIndex((item) => item.id === id);
    if (index < 0) return { error: p.notFound };

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= banners.length) {
      return { success: true };
    }

    const next = [...banners];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];
    await persistHeroBanners(supabase, next);
    revalidateHeroBannerPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.bannersPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

function revalidateFooterPaths() {
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/admin/footer");
  revalidatePath("/legal/privacy");
  revalidatePath("/legal/terms");
  revalidatePath("/legal/notice");
}

function footerErrorMessage(
  code: string,
  p: {
    taglineRequired: string;
    phoneRequired: string;
    emailInvalid: string;
    hrefInvalid: string;
    labelRequired: string;
    saveError: string;
  },
): string {
  if (code === "tagline_required") return p.taglineRequired;
  if (code === "phone_required") return p.phoneRequired;
  if (code === "email_invalid") return p.emailInvalid;
  if (code === "href_invalid") return p.hrefInvalid;
  if (code === "label_required") return p.labelRequired;
  return code || p.saveError;
}

function parseLinkGroup(raw: string): FooterLinkGroup | null {
  if (raw === "quick" || raw === "legal") return raw;
  return null;
}

export async function saveFooterContentAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    const existing = await getAdminFooterContent();
    const content = parseFooterContentFromForm(formData, existing);
    const issue = validateFooterContent(content);
    if (issue) return { error: footerErrorMessage(issue, p) };

    await persistFooterContent(supabase, content);
    revalidateFooterPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function saveFooterLinkAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    const group = parseLinkGroup(String(formData.get("group") ?? ""));
    if (!group) return { error: p.notFound };

    const content = await getAdminFooterContent();
    const links = getFooterLinkGroup(content, group);
    const existingId = String(formData.get("id") ?? "").trim();
    const existing = existingId
      ? links.find((item) => item.id === existingId) ?? null
      : null;
    const link = parseFooterLinkFromForm(formData, existing);
    const issue = validateFooterLink(link);
    if (issue) return { error: footerErrorMessage(issue, p) };

    const nextLinks = existing
      ? links.map((item) => (item.id === existing.id ? link : item))
      : [
          ...links,
          {
            ...link,
            sort_order:
              Number.isFinite(link.sort_order) && link.sort_order > 0
                ? link.sort_order
                : links.length,
          },
        ];

    await persistFooterContent(
      supabase,
      withFooterLinkGroup(content, group, nextLinks),
    );
    revalidateFooterPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function deleteFooterLinkAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    const group = parseLinkGroup(String(formData.get("group") ?? ""));
    const id = String(formData.get("id") ?? "").trim();
    if (!group || !id) return { error: p.notFound };

    const content = await getAdminFooterContent();
    const links = getFooterLinkGroup(content, group);
    const nextLinks = links.filter((item) => item.id !== id);
    if (nextLinks.length === links.length) return { error: p.notFound };
    if (nextLinks.length < 1) return { error: p.minOneLinkRequired };

    await persistFooterContent(
      supabase,
      withFooterLinkGroup(content, group, nextLinks),
    );
    revalidateFooterPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    return {
      error: err instanceof Error ? err.message : p.deleteFailed,
    };
  }
}

export async function toggleFooterLinkAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    const group = parseLinkGroup(String(formData.get("group") ?? ""));
    const id = String(formData.get("id") ?? "").trim();
    if (!group || !id) return { error: p.notFound };

    const content = await getAdminFooterContent();
    const links = getFooterLinkGroup(content, group);
    if (!links.some((item) => item.id === id)) return { error: p.notFound };

    const nextLinks = links.map((item) =>
      item.id === id ? { ...item, is_active: !item.is_active } : item,
    );

    await persistFooterContent(
      supabase,
      withFooterLinkGroup(content, group, nextLinks),
    );
    revalidateFooterPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function moveFooterLinkAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    const group = parseLinkGroup(String(formData.get("group") ?? ""));
    const id = String(formData.get("id") ?? "").trim();
    const direction = String(formData.get("direction") ?? "").trim();
    if (!group || !id || (direction !== "up" && direction !== "down")) {
      return { error: p.notFound };
    }

    const content = await getAdminFooterContent();
    const links = [...getFooterLinkGroup(content, group)].sort(
      (a, b) => a.sort_order - b.sort_order,
    );
    const index = links.findIndex((item) => item.id === id);
    if (index < 0) return { error: p.notFound };

    const swapWith = direction === "up" ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= links.length) return { success: true };

    const next = [...links];
    [next[index], next[swapWith]] = [next[swapWith], next[index]];

    await persistFooterContent(
      supabase,
      withFooterLinkGroup(content, group, next),
    );
    revalidateFooterPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.footerPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

function revalidateLegalPaths(slug?: string) {
  revalidatePath("/admin/legal");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/legal/${slug}`);
  } else {
    revalidatePath("/legal", "layout");
  }
}

function legalErrorMessage(
  code: string,
  p: {
    slugInvalid: string;
    slugTaken: string;
    titleRequired: string;
    sectionRequired: string;
    sectionEmpty: string;
    saveError: string;
  },
): string {
  if (code === "slug_invalid") return p.slugInvalid;
  if (code === "slug_taken") return p.slugTaken;
  if (code === "title_required") return p.titleRequired;
  if (code === "section_required") return p.sectionRequired;
  if (code === "section_empty") return p.sectionEmpty;
  return code || p.saveError;
}

async function syncFooterLegalLink(
  supabase: Awaited<ReturnType<typeof adminClient>>,
  page: AdminLegalPage,
  mode: "upsert" | "remove",
) {
  const footer = await getAdminFooterContent();
  const href = `/legal/${page.slug}`;
  let legal_links = [...footer.legal_links];

  if (mode === "remove") {
    legal_links = legal_links.filter((link) => link.href !== href);
  } else {
    const existing = legal_links.find((link) => link.href === href);
    if (existing) {
      legal_links = legal_links.map((link) =>
        link.href === href
          ? {
              ...link,
              label_ar: page.title_ar || link.label_ar,
              label_en: page.title_en || link.label_en,
              is_active: page.is_active,
            }
          : link,
      );
    } else {
      legal_links.push({
        id: page.id,
        href,
        label_ar: page.title_ar || page.slug,
        label_en: page.title_en || page.slug,
        sort_order: legal_links.length,
        is_active: page.is_active,
      });
    }
  }

  await persistFooterContent(supabase, { ...footer, legal_links });
  revalidatePath("/");
  revalidatePath("/admin/footer");
}

export async function saveLegalPageAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.legalPagesPage;
    const pages = await getAdminLegalPages();
    const existingId = String(formData.get("id") ?? "").trim();
    const existing = existingId
      ? pages.find((item) => item.id === existingId) ?? null
      : null;

    const page = parseLegalPageFromForm(formData, existing);
    const issue = validateLegalPage(page, pages, existing?.id);
    if (issue) return { error: legalErrorMessage(issue, p) };

    const next = existing
      ? pages.map((item) =>
          item.id === existing.id ? { ...page, id: existing.id } : item,
        )
      : [
          ...pages,
          {
            ...page,
            sort_order:
              Number.isFinite(page.sort_order) && page.sort_order > 0
                ? page.sort_order
                : pages.length,
          },
        ];

    await persistLegalPages(supabase, next);
    await syncFooterLegalLink(supabase, page, "upsert");
    revalidateLegalPaths(page.slug);
    if (existing && existing.slug !== page.slug) {
      revalidateLegalPaths(existing.slug);
    }
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.legalPagesPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function deleteLegalPageAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.legalPagesPage;
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.notFound };

    const pages = await getAdminLegalPages();
    const target = pages.find((item) => item.id === id);
    if (!target) return { error: p.notFound };
    if (pages.length <= 1) return { error: p.minOneRequired };

    const next = pages.filter((item) => item.id !== id);
    await persistLegalPages(supabase, next);
    await syncFooterLegalLink(supabase, target, "remove");
    revalidateLegalPaths(target.slug);
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.legalPagesPage;
    return {
      error: err instanceof Error ? err.message : p.deleteFailed,
    };
  }
}

export async function toggleLegalPageAction(
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.legalPagesPage;
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.notFound };

    const pages = await getAdminLegalPages();
    const target = pages.find((item) => item.id === id);
    if (!target) return { error: p.notFound };

    const nextPage = { ...target, is_active: !target.is_active };
    const next = pages.map((item) => (item.id === id ? nextPage : item));
    await persistLegalPages(supabase, next);
    await syncFooterLegalLink(supabase, nextPage, "upsert");
    revalidateLegalPaths(target.slug);
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.legalPagesPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

export async function saveWhatsAppFloatAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.whatsappFloatPage;
    const settings = parseWhatsAppFloatFromForm(formData);
    const issue = validateWhatsAppFloatSettings(settings);
    if (issue === "phone_invalid") return { error: p.phoneInvalid };
    if (issue === "url_invalid") return { error: p.urlInvalid };
    if (issue) return { error: p.saveError };

    await persistWhatsAppFloatSettings(supabase, settings);
    revalidatePath("/");
    revalidatePath("/admin/whatsapp");
    revalidatePath("/services");
    revalidatePath("/contact");
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.whatsappFloatPage;
    return {
      error: err instanceof Error ? err.message : p.saveError,
    };
  }
}

function revalidateVehicleClassPaths() {
  revalidatePath("/admin/services");
  revalidatePath("/admin/orders");
  revalidatePath("/request");
  revalidatePath("/client/request");
  revalidatePath("/client/vehicles");
  revalidatePath("/services");
}

function vehicleClassValidationMessage(
  issue: string,
  p: {
    nameArRequired: string;
    idInvalid: string;
    idDuplicate: string;
    minOneRequired: string;
    saveError: string;
  },
): string {
  if (issue === "vehicle_class_name_ar_required") return p.nameArRequired;
  if (issue === "vehicle_class_id_invalid") return p.idInvalid;
  if (issue === "vehicle_class_id_duplicate") return p.idDuplicate;
  if (issue === "vehicle_classes_min_one_required") return p.minOneRequired;
  return p.saveError;
}

export async function saveVehicleClassAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.vehicleClassesPage;

    const existingId = String(formData.get("id") ?? "").trim().toLowerCase();
    const classes = await getAdminVehicleClasses();
    const existing = existingId
      ? classes.find((item) => item.id === existingId) ?? null
      : null;

    const row = parseVehicleClassFromForm(formData, existing);
    const issue = validateVehicleClass(row);
    if (issue) {
      return {
        error: vehicleClassValidationMessage(issue, p),
      };
    }

    const duplicate = classes.find(
      (item) => item.id === row.id && item.id !== existing?.id,
    );
    if (duplicate) {
      return { error: p.idDuplicate };
    }

    const next = existing
      ? classes.map((item) => (item.id === existing.id ? row : item))
      : [...classes, { ...row, sort_order: classes.length }];

    await persistVehicleClasses(supabase, next);
    revalidateVehicleClassPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.vehicleClassesPage;
    const message = err instanceof Error ? err.message : p.saveError;
    return { error: vehicleClassValidationMessage(message, p) };
  }
}

export async function deleteVehicleClassAction(
  _prev: MutationFormState,
  formData: FormData,
): Promise<MutationFormState> {
  try {
    await requireProfileOrThrow(["admin"]);
    const supabase = await adminClient();
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.vehicleClassesPage;

    const id = String(formData.get("id") ?? "").trim().toLowerCase();
    if (!id) return { error: p.notFound };

    const classes = await getAdminVehicleClasses();
    const next = classes.filter((item) => item.id !== id);
    if (next.length === classes.length) return { error: p.notFound };
    if (next.length < 1) return { error: p.minOneRequired };

    await persistVehicleClasses(supabase, next);
    revalidateVehicleClassPaths();
    return { success: true };
  } catch (err) {
    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.vehicleClassesPage;
    const message = err instanceof Error ? err.message : p.deleteError;
    return { error: vehicleClassValidationMessage(message, p) };
  }
}
