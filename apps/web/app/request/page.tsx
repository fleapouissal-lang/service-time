import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RequestLoginGate } from "@/components/request/request-login-gate";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { getCurrentProfile } from "@/lib/auth";
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

export default async function RequestPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const nextPath = buildNextPath(rawParams);
  const profile = await getCurrentProfile();

  if (!profile || !profile.is_active) {
    return <RequestLoginGate nextPath={nextPath} />;
  }

  if (profile.role !== "client") {
    redirect(getProfileHomePath(profile.role));
  }

  return (
    <Suspense>
      <ServiceRequestForm />
    </Suspense>
  );
}
