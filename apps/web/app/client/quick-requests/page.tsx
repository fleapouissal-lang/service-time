import { Suspense } from "react";
import { ClientNewQuickRequestSection } from "@/components/client/client-new-quick-request-section";
import { ClientQuickRequestsTable } from "@/components/client/client-quick-requests-table";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { createAuthServerClient, requireProfile } from "@/lib/auth";
import {
  getClientQuickRequestSearchPlaceholder,
  getQuickRequestAdminReadFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getClientQuickRequests } from "@/lib/quick-requests-queries";
import { getProfileDisplayName } from "@/lib/profile-display-name";
import { getServerI18n } from "@/lib/i18n/server";
import { filterQuickRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientQuickRequestsPage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const p = t.dashboard.client.quickRequestsPage;
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const params = parseListFilters(await searchParams);

  const supabase = await createAuthServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const allRequests = await getClientQuickRequests(profile.id);
  const requests = filterQuickRequests(allRequests, params);

  return (
    <div className="mx-auto w-[90%] max-w-[1200px] space-y-6 pb-16">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold">{t.dashboard.client.quickRequests}</h1>
        <p className="text-muted">{p.subtitle}</p>
      </div>

      <Suspense>
        <ClientNewQuickRequestSection
          defaultName={getProfileDisplayName(profile, locale)}
          defaultPhone={profile.phone ?? ""}
          defaultEmail={user?.email ?? ""}
        />
      </Suspense>

      <DashboardFilterBar
        pathname="/client/quick-requests"
        values={params}
        searchPlaceholder={getClientQuickRequestSearchPlaceholder(t)}
        selects={[
          {
            name: "admin_read",
            label: p.table.adminStatus,
            options: getQuickRequestAdminReadFilterOptionsForDashboard(t, "client"),
          },
        ]}
        resultCount={requests.length}
        totalCount={allRequests.length}
      />

      <Card>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <p className="p-6 text-center text-sm text-muted">
              {allRequests.length === 0
                ? t.common.noData
                : t.common.noResultsFiltered}
            </p>
          ) : (
            <ClientQuickRequestsTable requests={requests} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
