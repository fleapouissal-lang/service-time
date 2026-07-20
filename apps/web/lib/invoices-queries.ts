import type { Invoice, Profile } from "@service-time/types";
import { createAuthServerClient } from "@/lib/auth";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";

export type InvoiceWithClient = Invoice & {
  client?: Pick<
    Profile,
    "full_name" | "full_name_ar" | "full_name_en" | "phone"
  > | null;
};

export async function getAdminInvoices(): Promise<InvoiceWithClient[]> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return [];

  const { data: invoices } = await supabase
    .from("invoices")
    .select("*")
    .order("created_at", { ascending: false });

  if (!invoices?.length) return [];

  const clientIds = [
    ...new Set(
      invoices
        .map((invoice) => invoice.client_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const { data: profiles } = clientIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, full_name_ar, full_name_en, phone")
        .in("id", clientIds)
    : { data: [] as Profile[] };

  const profileById = new Map(
    ((profiles as Profile[]) ?? []).map((profile) => [profile.id, profile]),
  );

  return (invoices as Invoice[]).map((invoice) => ({
    ...invoice,
    client: invoice.client_id
      ? (profileById.get(invoice.client_id) ?? null)
      : null,
  }));
}

export async function getAdminInvoiceById(
  id: string,
): Promise<InvoiceWithClient | null> {
  const supabase = getAdminSupabaseClient();
  if (!supabase) return null;

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!invoice) return null;

  let client: InvoiceWithClient["client"] = null;
  if (invoice.client_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, full_name_ar, full_name_en, phone")
      .eq("id", invoice.client_id)
      .maybeSingle();
    client = profile;
  }

  return {
    ...(invoice as Invoice),
    client,
  };
}

/** Client: only validated invoices (also enforced by RLS). */
export async function getClientValidatedInvoices(
  clientId: string,
): Promise<Invoice[]> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("client_id", clientId)
    .eq("status", "validated")
    .order("created_at", { ascending: false });

  return (data as Invoice[]) ?? [];
}

export async function getClientValidatedInvoice(
  clientId: string,
  invoiceId: string,
): Promise<Invoice | null> {
  const supabase = await createAuthServerClient();
  const { data } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("client_id", clientId)
    .eq("status", "validated")
    .maybeSingle();

  return (data as Invoice) ?? null;
}
