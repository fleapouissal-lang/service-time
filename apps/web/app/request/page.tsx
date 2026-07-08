import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RequestPageContent } from "@/components/request/request-page-content";
import { getCurrentProfile } from "@/lib/auth";
import { getClientVehicles } from "@/lib/client-vehicles";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";
import { buildPageMetadata } from "@/lib/seo";
import { getProfileHomePath } from "@/lib/profile-home";
import { resolvePublicServicesCatalog } from "@/lib/services-catalog-session";

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return buildPageMetadata({
    title: t.meta.request,
    description: t.meta.descriptions.request,
    pathname: "/request",
    locale,
  });
}

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function RequestPage({ searchParams }: PageProps) {
  const rawParams = await searchParams;
  const mode = rawParams.mode?.trim();

  if (mode) {
    redirect("/request");
  }

  const { locale } = await getServerI18n();
  const profile = await getCurrentProfile();

  if (profile?.is_active && profile.role !== "client") {
    redirect(getProfileHomePath(profile.role));
  }

  const isClient = Boolean(profile?.is_active && profile.role === "client");
  const [savedVehicles, catalogCategories] = await Promise.all([
    isClient && profile ? getClientVehicles(profile.id) : Promise.resolve([]),
    resolvePublicServicesCatalog(locale),
  ]);

  return (
    <Suspense>
      <RequestPageContent
        isClient={isClient}
        defaultName={
          isClient ? getProfileDisplayName(profile!, locale) : ""
        }
        defaultPhone={isClient ? profile!.phone ?? "" : ""}
        loginNextPath="/request"
        savedVehicles={savedVehicles}
        catalogCategories={catalogCategories}
      />
    </Suspense>
  );
}
