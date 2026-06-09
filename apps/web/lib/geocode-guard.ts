import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/auth";
import { checkApiRateLimit, checkGeocodeRateLimit } from "@/lib/form-security";

async function isSameOriginRequest(): Promise<boolean> {
  const h = await headers();
  const host = h.get("host");
  if (!host) return false;

  const allowedHosts = new Set([host]);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      allowedHosts.add(new URL(siteUrl).host);
    } catch {
      // ignore invalid site url
    }
  }

  const origin = h.get("origin");
  if (origin) {
    try {
      return allowedHosts.has(new URL(origin).host);
    } catch {
      return false;
    }
  }

  const referer = h.get("referer");
  if (referer) {
    try {
      return allowedHosts.has(new URL(referer).host);
    } catch {
      return false;
    }
  }

  return false;
}

export async function guardGeocodeApi(): Promise<
  { ok: true } | { ok: false; response: NextResponse }
> {
  const profile = await requireProfile(["client", "admin", "technician"]);

  if (profile) {
    if (!(await checkGeocodeRateLimit(profile.id))) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Too many geocoding requests. Please wait." },
          { status: 429 },
        ),
      };
    }
    return { ok: true };
  }

  if (!(await isSameOriginRequest())) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!(await checkApiRateLimit("geocodePublic", "public"))) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many geocoding requests. Please wait." },
        { status: 429 },
      ),
    };
  }

  return { ok: true };
}
