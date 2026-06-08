import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  RequestPageContent,
} from "@/components/request/request-page-content";
import type { RequestMode } from "@/components/request/request-mode-hub";
import { getCurrentProfile } from "@/lib/auth";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";
import { getProfileHomePath } from "@/lib/profile-home";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.request };
}

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

function buildNextPath(
  searchParams: Record<string, string | undefined>,
): string {
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) sp.set(key, value);
  }
  const qs = sp.toString();
  return qs ? `/request?${qs}` : "/request";
}

function parseMode(raw: string | undefined): RequestMode {
  if (raw === "full" || raw === "quick" || raw === "whatsapp") return raw;
  return "hub";
}

export default async function RequestPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const { locale } = await getServerI18n();
  const mode = parseMode(rawParams.mode);
  const nextPath = buildNextPath({ ...rawParams, mode: "full" });
  const profile = await getCurrentProfile();

  if (
    profile?.is_active &&
    profile.role !== "client" &&
    mode === "full"
  ) {
    redirect(getProfileHomePath(profile.role));
  }

  const isClient = Boolean(profile?.is_active && profile.role === "client");

  return (
    <Suspense>
      <RequestPageContent
        mode={mode}
        isClient={isClient}
        defaultName={
          isClient ? getProfileDisplayName(profile!, locale) : ""
        }
        defaultPhone={isClient ? profile!.phone ?? "" : ""}
        loginNextPath={nextPath}
      />
    </Suspense>
  );
}
