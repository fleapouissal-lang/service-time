import { normalizeEmail } from "@/lib/password-reset";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { normalizePhone, phoneToWhatsAppDigits } from "@/lib/whatsapp-utils";

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

/** Résout email ou téléphone vers l'email auth.users (service role). */
export async function resolveLoginEmail(
  identifier: string,
): Promise<string | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (isEmailIdentifier(trimmed)) {
    const email = normalizeEmail(trimmed);
    return email.includes("@") ? email : null;
  }

  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const normalized = normalizePhone(trimmed);
  const digits = phoneToWhatsAppDigits(trimmed);

  const { data: exactMatch } = await admin
    .from("profiles")
    .select("id")
    .eq("phone", normalized)
    .maybeSingle();

  if (exactMatch) {
    const { data: authData, error } = await admin.auth.admin.getUserById(
      exactMatch.id,
    );
    if (error || !authData.user?.email) return null;
    return authData.user.email;
  }

  const { data: profiles, error: listError } = await admin
    .from("profiles")
    .select("id, phone")
    .not("phone", "is", null);

  if (listError || !profiles?.length) return null;

  const match = profiles.find(
    (profile) =>
      profile.phone &&
      phoneToWhatsAppDigits(profile.phone) === digits,
  );

  if (!match) return null;

  const { data: authData, error } = await admin.auth.admin.getUserById(
    match.id,
  );
  if (error || !authData.user?.email) return null;
  return authData.user.email;
}
