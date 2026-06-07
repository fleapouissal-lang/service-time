import Link from "next/link";
import { ProfileAvatar } from "@/components/layout/profile-avatar";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { getClientRequests } from "@/lib/dashboard-queries";
import {
  getClientOrderSearchPlaceholder,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import { getIntlLocale } from "@/lib/i18n/config";
import { getProfileRoleLabel, getStatusLabels } from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientProfilePage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const params = parseListFilters(await searchParams);
  const allOrders = await getClientRequests();
  const orders = filterServiceRequests(allOrders, params);
  const statusLabels = getStatusLabels(t);
  const intlLocale = getIntlLocale(locale);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t.meta.clientProfile}</h1>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-6 p-6">
          <ProfileAvatar
            fullName={profile.full_name}
            avatarUrl={profile.avatar_url}
            size="md"
            className="!size-20 !text-2xl"
          />
          <div className="space-y-2">
            <p className="text-xl font-bold">{profile.full_name}</p>
            <p className="text-sm text-muted">
              {getProfileRoleLabel(t, profile.role)}
            </p>
            {profile.phone ? (
              <p className="text-sm" dir="ltr">
                {profile.phone}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">{t.dashboard.client.orders}</h2>

        <DashboardFilterBar
          pathname="/client/profile"
          values={params}
          searchPlaceholder={getClientOrderSearchPlaceholder(t)}
          selects={[
            {
              name: "status",
              label: t.common.status,
              options: getStatusFilterOptionsForDashboard(t),
            },
          ]}
          resultCount={orders.length}
          totalCount={allOrders.length}
        />

        {orders.length === 0 ? (
          <p className="text-sm text-muted">
            {allOrders.length === 0
              ? t.common.noData
              : t.common.noResultsFiltered}
          </p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 8).map((order) => (
              <Link
                key={order.id}
                href={`/client/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-primary/5"
              >
                <div>
                  <p className="font-semibold">
                    {order.car_type ?? t.dashboard.common.serviceRequest}
                  </p>
                  <p className="text-sm text-muted">
                    {new Date(order.created_at).toLocaleDateString(intlLocale)}
                  </p>
                </div>
                <span className="text-sm font-medium text-primary">
                  {statusLabels[order.status as keyof typeof statusLabels]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
