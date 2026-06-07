import type { SupabaseClient } from "@supabase/supabase-js";
import { findAuthUserByEmail } from "@/lib/auth-users";
import {
  generateSecurePassword,
  normalizeEmail,
} from "@/lib/password-reset";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import {
  normalizePhone,
  phoneToWhatsAppDigits,
} from "@/lib/whatsapp-utils";

export type QuickRequestClientResult = {
  clientId: string;
  createdNew: boolean;
  loginEmail: string;
  generatedPassword?: string;
  notifiedEmail: boolean;
};

function buildSyntheticEmail(phone: string): string {
  return `${phoneToWhatsAppDigits(phone)}@quick.servicetime.sa`;
}

async function getClientProfile(
  admin: SupabaseClient,
  userId: string,
): Promise<{ id: string; full_name: string; phone: string | null } | null> {
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, phone, role, is_active")
    .eq("id", userId)
    .maybeSingle();

  if (!data || data.role !== "client") return null;
  return {
    id: data.id,
    full_name: data.full_name,
    phone: data.phone,
  };
}

async function findClientByPhone(
  admin: SupabaseClient,
  phone: string,
): Promise<{ id: string; full_name: string; phone: string | null } | null> {
  const digits = phoneToWhatsAppDigits(phone);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, phone")
    .eq("role", "client");

  if (!profiles?.length) return null;

  const match = profiles.find(
    (profile) =>
      profile.phone && phoneToWhatsAppDigits(profile.phone) === digits,
  );
  return match ?? null;
}

/** Cherche un client existant par email puis par téléphone. */
export async function findExistingQuickRequestClient(
  phone: string,
  email: string | null,
): Promise<{ clientId: string; loginEmail: string } | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  if (email) {
    const authUser = await findAuthUserByEmail(email);
    if (authUser) {
      const profile = await getClientProfile(admin, authUser.id);
      if (profile) {
        return {
          clientId: profile.id,
          loginEmail: authUser.email ?? email,
        };
      }
    }
  }

  const byPhone = await findClientByPhone(admin, phone);
  if (!byPhone) return null;

  const { data: authData } = await admin.auth.admin.getUserById(byPhone.id);
  return {
    clientId: byPhone.id,
    loginEmail: authData.user?.email ?? buildSyntheticEmail(phone),
  };
}

/** Crée ou retrouve le client lié à une demande rapide. */
export async function resolveQuickRequestClient(input: {
  fullName: string;
  phone: string;
  email: string | null;
}): Promise<
  | { ok: true; result: QuickRequestClientResult }
  | { ok: false; error: string }
> {
  const admin = getAdminSupabaseClient();
  if (!admin) {
    return { ok: false, error: "server_incomplete" };
  }

  const normalizedPhone = normalizePhone(input.phone);
  const normalizedEmail = input.email ? normalizeEmail(input.email) : null;

  const existing = await findExistingQuickRequestClient(
    normalizedPhone,
    normalizedEmail,
  );

  if (existing) {
    await admin
      .from("profiles")
      .update({
        full_name: input.fullName.trim(),
        phone: normalizedPhone,
        is_active: true,
      })
      .eq("id", existing.clientId);

    return {
      ok: true,
      result: {
        clientId: existing.clientId,
        createdNew: false,
        loginEmail: existing.loginEmail,
        notifiedEmail: false,
      },
    };
  }

  if (normalizedEmail) {
    const taken = await findAuthUserByEmail(normalizedEmail);
    if (taken) {
      return { ok: false, error: "email_used_non_client" };
    }
  }

  const loginEmail = normalizedEmail ?? buildSyntheticEmail(normalizedPhone);
  const password = generateSecurePassword(12);

  const { data: created, error: createError } =
    await admin.auth.admin.createUser({
      email: loginEmail,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName,
        phone: normalizedPhone,
        source: "quick_request",
      },
    });

  if (createError || !created.user) {
    console.error("[quick-request] create user:", createError);
    return { ok: false, error: "create_user_failed" };
  }

  const userId = created.user.id;

  const { error: profileError } = await admin.from("profiles").upsert(
    {
      id: userId,
      full_name: input.fullName.trim(),
      phone: normalizedPhone,
      role: "client",
      technician_type: null,
      is_active: true,
    },
    { onConflict: "id" },
  );

  if (profileError) {
    console.error("[quick-request] profile:", profileError);
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: "create_profile_failed" };
  }

  return {
    ok: true,
    result: {
      clientId: userId,
      createdNew: true,
      loginEmail,
      generatedPassword: password,
      notifiedEmail: Boolean(normalizedEmail),
    },
  };
}

export function getLoginUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3000";
  return `${base}/login`;
}
