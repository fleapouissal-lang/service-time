import type { Metadata } from "next";
import Link from "next/link";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TrackingSearch } from "@/components/tracking/tracking-search";
import {
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  CLIENT_ORDER_SEARCH_PLACEHOLDER,
  STATUS_FILTER_OPTIONS,
} from "@/lib/dashboard-filter-options";
import { getClientRequests } from "@/lib/dashboard-queries";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

export const metadata: Metadata = {
  title: "تتبع الطلب",
};

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientTrackPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const allOrders = await getClientRequests();
  const orders = filterServiceRequests(allOrders, params);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">تتبع الطلب</h1>
        <p className="text-muted">ابحث برمز التتبع أو اختر من طلباتك</p>
      </div>

      <DashboardFilterBar
        pathname="/client/track"
        values={params}
        searchPlaceholder={CLIENT_ORDER_SEARCH_PLACEHOLDER}
        selects={[
          { name: "status", label: "الحالة", options: STATUS_FILTER_OPTIONS },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <TrackingSearch embedded />

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">طلباتي للتتبع</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">
              {allOrders.length === 0
                ? "لا توجد طلبات للتتبع."
                : "لا توجد نتائج مطابقة للتصفية."}
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/client/track/${order.tracking_token}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-primary/5"
                >
                  <div>
                    <p className="font-semibold">
                      {SERVICE_TYPE_LABELS[order.service_type]}
                    </p>
                    <p className="text-xs text-muted" dir="ltr">
                      {order.tracking_token}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
