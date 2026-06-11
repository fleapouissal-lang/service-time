import { normalizeEmail } from "@/lib/password-reset";
import { getAdminSupabaseClient } from "@/lib/supabase-admin";
import { normalizePhone, phoneToWhatsAppDigits } from "@/lib/whatsapp-utils";

export function isEmailIdentifier(value: string): boolean {
  return value.includes("@");
}

async function authEmailForProfileId(userId: string): Promise<string | null> {
  const admin = getAdminSupabaseClient();
  if (!admin) return null;

  const { data: authData, error } = await admin.auth.admin.getUserById(userId);
  if (error || !authData.user?.email) return null;
  return authData.user.email;
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
  if (!digits) return null;

  const phoneCandidates = Array.from(
    new Set([normalized, trimmed.replace(/\s+/g, ""), digits].filter(Boolean)),
  );

  for (const phone of phoneCandidates) {
    const { data: exactMatch } = await admin
      .from("profiles")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    if (exactMatch) {
      return authEmailForProfileId(exactMatch.id);
    }
  }

  const suffix = digits.slice(-9);
  if (suffix.length < 7) return null;

  const { data: profiles, error: listError } = await admin
    .from("profiles")
    .select("id, phone")
    .not("phone", "is", null)
    .ilike("phone", `%${suffix}%`)
    .limit(25);

  if (listError || !profiles?.length) return null;

  const match = profiles.find(
    (profile) =>
      profile.phone && phoneToWhatsAppDigits(profile.phone) === digits,
  );

  if (!match) return null;

  return authEmailForProfileId(match.id);
}
