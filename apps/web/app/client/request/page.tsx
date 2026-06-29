import type { Metadata } from "next";
import { Suspense } from "react";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import { getClientVehicles } from "@/lib/client-vehicles";
import { requireProfile } from "@/lib/auth";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.clientRequest };
}

export default async function ClientRequestPage() {
  const { t, locale } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  const savedVehicles = profile ? await getClientVehicles(profile.id) : [];

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">{t.request.title}</h1>
        <p className="text-muted">{t.request.description}</p>
      </div>

      <Suspense>
        <div className="mx-auto w-full max-w-2xl">
          <ServiceRequestForm
            embedded
            twoSteps
            defaultName={
              profile ? getProfileDisplayName(profile, locale) : ""
            }
            defaultPhone={profile?.phone ?? ""}
            savedVehicles={savedVehicles}
          />
        </div>
      </Suspense>
    </div>
  );
}
