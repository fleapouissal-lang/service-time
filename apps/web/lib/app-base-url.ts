import { headers } from "next/headers";

function isConfiguredPublicUrl(url: string | undefined): url is string {
  if (!url) return false;
  const trimmed = url.trim().replace(/\/$/, "");
  if (!trimmed) return false;
  if (trimmed.includes("votre-domaine")) return false;
  if (trimmed.includes("localhost")) return false;
  return true;
}

/** Base URL for Paymob callbacks — env-only in production (no Host header fallback). */
export async function getAppBaseUrl(): Promise<string> {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()?.replace(/\/$/, "");

  if (isConfiguredPublicUrl(envUrl)) {
    return envUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "NEXT_PUBLIC_APP_URL must be set to a public HTTPS URL in production.",
    );
  }

  const headersList = await headers();
  const host = headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  if (host) {
    return `${protocol}://${host}`;
  }

  return envUrl || "http://localhost:3000";
}
