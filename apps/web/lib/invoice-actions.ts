"use server";

import { revalidatePath } from "next/cache";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { getLocale } from "@/lib/i18n/get-locale";

function revalidateInvoicePaths(id: string, clientId: string | null) {
  revalidatePath("/admin/invoices");
  revalidatePath(`/admin/invoices/${id}`);
  revalidatePath("/client/invoices");
  if (clientId) {
    revalidatePath(`/client/invoices/${id}`);
  }
}

export type UpdateInvoiceFormState = {
  success?: boolean;
  error?: string;
};

export async function updateInvoiceAction(
  _prev: UpdateInvoiceFormState,
  formData: FormData,
): Promise<UpdateInvoiceFormState> {
  try {
    const profile = await requireProfile(["admin"]);
    if (!profile) return { error: "Unauthorized" };

    const t = getDictionary(await getLocale());
    const p = t.dashboard.admin.invoicesPage;
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: p.invalidId };

    const customerName = String(formData.get("customer_name") ?? "").trim();
    const customerPhone = String(formData.get("customer_phone") ?? "").trim();
    const customerCompanyName = String(
      formData.get("customer_company_name") ?? "",
    ).trim();
    const customerIce = String(formData.get("customer_ice") ?? "").trim();
    const customerEmail = String(formData.get("customer_email") ?? "").trim();
    const customerAddress = String(
      formData.get("customer_address") ?? "",
    ).trim();
    const notes = String(formData.get("notes") ?? "").trim();
    const amountRaw = String(formData.get("amount") ?? "").trim().replace(",", ".");
    const amount = Number(amountRaw);

    if (!customerName) return { error: p.edit.nameRequired };
    if (!Number.isFinite(amount) || amount < 0) {
      return { error: p.edit.invalidAmount };
    }

    const supabase = await createAuthServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("id, client_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!existing) return { error: p.notFound };

    const { error } = await supabase
      .from("invoices")
      .update({
        customer_name: customerName,
        customer_phone: customerPhone || null,
        customer_company_name: customerCompanyName || null,
        customer_ice: customerIce || null,
        customer_email: customerEmail || null,
        customer_address: customerAddress || null,
        notes: notes || null,
        amount: Math.round(amount * 100) / 100,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidateInvoicePaths(id, existing.client_id);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type ValidateInvoiceFormState = {
  success?: boolean;
  error?: string;
};

export async function validateInvoiceAction(
  _prev: ValidateInvoiceFormState,
  formData: FormData,
): Promise<ValidateInvoiceFormState> {
  try {
    const profile = await requireProfile(["admin"]);
    if (!profile) return { error: "Unauthorized" };

    const t = getDictionary(await getLocale());
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: t.dashboard.admin.invoicesPage.invalidId };

    const supabase = await createAuthServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status, client_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!existing) {
      return { error: t.dashboard.admin.invoicesPage.notFound };
    }
    if (existing.status === "validated") {
      return { success: true };
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "validated",
        validated_at: new Date().toISOString(),
        validated_by: profile.id,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidateInvoicePaths(id, existing.client_id);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export type UnvalidateInvoiceFormState = {
  success?: boolean;
  error?: string;
};

/** Hide invoice from client again (admin only). */
export async function unvalidateInvoiceAction(
  _prev: UnvalidateInvoiceFormState,
  formData: FormData,
): Promise<UnvalidateInvoiceFormState> {
  try {
    const profile = await requireProfile(["admin"]);
    if (!profile) return { error: "Unauthorized" };

    const t = getDictionary(await getLocale());
    const id = String(formData.get("id") ?? "").trim();
    if (!id) return { error: t.dashboard.admin.invoicesPage.invalidId };

    const supabase = await createAuthServerClient();
    const { data: existing, error: fetchError } = await supabase
      .from("invoices")
      .select("id, status, client_id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) return { error: fetchError.message };
    if (!existing) {
      return { error: t.dashboard.admin.invoicesPage.notFound };
    }

    const { error } = await supabase
      .from("invoices")
      .update({
        status: "pending",
        validated_at: null,
        validated_by: null,
      })
      .eq("id", id);

    if (error) return { error: error.message };

    revalidateInvoicePaths(id, existing.client_id);
    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
