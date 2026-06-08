import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { ServiceRequestForm } from "@/components/request/service-request-form";
import {
  getExecutionMethodFilterOptionsForDashboard,
  getServiceTypeFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientVehicles } from "@/lib/client-vehicles";
import { requireProfile } from "@/lib/auth";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";
import { parseListFilters } from "@/lib/list-filters";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: t.meta.clientRequest };
}

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientRequestPage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  const params = parseListFilters(await searchParams);
  const savedVehicles = profile
    ? (await getClientVehicles(profile.id)).map((vehicle) => vehicle.label)
    : [];

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div>
        <h1 className="text-2xl font-bold">{t.request.title}</h1>
        <p className="text-muted">{t.request.description}</p>
      </div>

      <DashboardFilterBar
        pathname="/client/request"
        values={{
          type: params.type,
          execution_method: params.execution_method,
        }}
        showSearch={false}
        selects={[
          {
            name: "type",
            label: t.request.form.serviceType,
            options: getServiceTypeFilterOptionsForDashboard(t),
          },
          {
            name: "execution_method",
            label: t.request.form.executionMethod,
            options: getExecutionMethodFilterOptionsForDashboard(t),
          },
        ]}
      />

      <Suspense>
        <ServiceRequestForm
          embedded
          fullWidth
          defaultName={
            profile ? getProfileDisplayName(profile, locale) : ""
          }
          defaultPhone={profile?.phone ?? ""}
          savedVehicles={savedVehicles}
        />
      </Suspense>
    </div>
  );
}
