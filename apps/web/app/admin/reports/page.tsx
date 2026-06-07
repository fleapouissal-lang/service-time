import { Card, CardContent } from "@/components/ui/card";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { STATUS_LABELS } from "@/lib/constants";
import { buildDashboardKpis } from "@/lib/dashboard-analytics";
import { getAdminServiceRequests } from "@/lib/admin-dashboard-data";
import {
  ORDER_SEARCH_PLACEHOLDER,
  PERIOD_FILTER_OPTIONS,
  PRIORITY_FILTER_OPTIONS,
  SERVICE_TYPE_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
} from "@/lib/dashboard-filter-options";
import { filterServiceRequests, parseListFilters } from "@/lib/list-filters";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminReportsPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const allOrders = await getAdminServiceRequests();
  const orders = filterServiceRequests(allOrders, params);
  const stats = buildDashboardKpis(orders);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">التقارير</h1>
        <p className="text-sm text-muted">بيانات مباشرة من قاعدة البيانات</p>
      </div>

      <DashboardFilterBar
        pathname="/admin/reports"
        values={params}
        searchPlaceholder={ORDER_SEARCH_PLACEHOLDER}
        selects={[
          { name: "period", label: "الفترة", options: PERIOD_FILTER_OPTIONS },
          { name: "status", label: "الحالة", options: STATUS_FILTER_OPTIONS },
          {
            name: "priority",
            label: "الأولوية",
            options: PRIORITY_FILTER_OPTIONS,
          },
          {
            name: "service_type",
            label: "نوع الخدمة",
            options: SERVICE_TYPE_FILTER_OPTIONS,
          },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">توزيع الحالات</h2>
            <ul className="mt-4 space-y-2 text-sm">
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <li key={key} className="flex justify-between">
                  <span>{label}</span>
                  <span className="font-semibold">
                    {stats.byStatus[key] ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="font-semibold">مؤشرات</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>إجمالي الطلبات</dt>
                <dd className="font-semibold">{stats.total}</dd>
              </div>
              <div className="flex justify-between">
                <dt>أولوية عالية</dt>
                <dd className="font-semibold">{stats.highPriority}</dd>
              </div>
              <div className="flex justify-between">
                <dt>متوسط أيام الإنجاز</dt>
                <dd className="font-semibold">
                  {stats.avgCompletionDays !== null
                    ? `${stats.avgCompletionDays} يوم`
                    : "—"}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>طلبات هذا الأسبوع</dt>
                <dd className="font-semibold">{stats.weekCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt>غير معيّنة</dt>
                <dd className="font-semibold">{stats.unassigned}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
