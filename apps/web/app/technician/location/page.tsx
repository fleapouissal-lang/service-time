import Link from "next/link";
import { LocationTracker } from "@/components/technician/location-tracker";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { requireProfile } from "@/lib/auth";
import { getTechnicianRequests } from "@/lib/dashboard-queries";
import {
  ORDER_SEARCH_PLACEHOLDER,
  STATUS_FILTER_OPTIONS,
} from "@/lib/dashboard-filter-options";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function TechnicianLocationPage({
  searchParams,
}: PageProps) {
  const profile = await requireProfile(["technician"]);
  if (!profile) return null;

  const params = parseListFilters(await searchParams);
  const allOrders = await getTechnicianRequests(profile.id);
  const orders = filterServiceRequests(allOrders, params).filter(
    (o) => o.status !== "completed" && o.status !== "cancelled",
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">موقعي الحالي</h1>

      <DashboardFilterBar
        pathname="/technician/location"
        values={params}
        searchPlaceholder={ORDER_SEARCH_PLACEHOLDER}
        selects={[
          { name: "status", label: "الحالة", options: STATUS_FILTER_OPTIONS },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-sm text-muted">
            شارك موقعك عندما تكون في الطريق إلى العميل.
          </p>
          <LocationTracker active />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">طلبات نشطة</h2>
          {orders.length === 0 ? (
            <p className="text-sm text-muted">لا توجد طلبات نشطة حالياً.</p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/technician/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4 transition-colors hover:bg-primary/5"
                >
                  <div>
                    <p className="font-semibold">{order.customer_name}</p>
                    <p className="text-sm text-muted">
                      {SERVICE_TYPE_LABELS[order.service_type]} ·{" "}
                      {EXECUTION_METHOD_LABELS[order.execution_method]}
                    </p>
                    <p className="mt-1 text-sm">{order.location_text ?? "—"}</p>
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
