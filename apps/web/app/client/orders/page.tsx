import Link from "next/link";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import { getClientRequests } from "@/lib/dashboard-queries";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function ClientOrdersPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const allOrders = await getClientRequests();
  const orders = filterServiceRequests(allOrders, params);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">طلباتي</h1>
        <Link
          href="/client/request"
          className="text-sm font-semibold text-primary hover:underline"
        >
          + طلب جديد
        </Link>
      </div>

      <DashboardFilterBar
        pathname="/client/orders"
        values={params}
        searchPlaceholder="نوع السيارة، الموقع، رمز التتبع..."
        selects={[{ name: "status", label: "الحالة", options: STATUS_OPTIONS }]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-semibold">
                  {SERVICE_TYPE_LABELS[order.service_type]}
                </p>
                <p className="text-sm text-muted">
                  {EXECUTION_METHOD_LABELS[order.execution_method]} ·{" "}
                  {order.location_text ?? "—"}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {new Date(order.created_at).toLocaleString("ar-SA")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">
                  {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                </Badge>
                <Link
                  href={`/client/orders/${order.id}`}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  التفاصيل
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <p className="text-muted">
            {allOrders.length === 0 ? (
              <>
                لا توجد طلبات.{" "}
                <Link href="/client/request" className="text-primary">
                  أنشئ طلباً الآن
                </Link>
              </>
            ) : (
              "لا توجد نتائج مطابقة للتصفية."
            )}
          </p>
        )}
      </div>
    </div>
  );
}
