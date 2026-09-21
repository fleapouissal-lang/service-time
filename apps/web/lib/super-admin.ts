/** Official Super Admin account (primary platform owner). */
export const SUPER_ADMIN_EMAIL = "support@servicetime.com.sa";

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  return (email ?? "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}
