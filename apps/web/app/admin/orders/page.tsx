import { updateOrderAction } from "@/app/admin/actions";
import { DashboardFilterBar } from "@/components/dashboard/dashboard-filter-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { IconSelect } from "@/components/ui/icon-select";
import {
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  getAllServiceRequests,
  getTechnicians,
} from "@/lib/dashboard-queries";
import {
  filterServiceRequests,
  parseListFilters,
} from "@/lib/list-filters";
import {
  buildPrioritySelectOptions,
  buildStatusSelectOptions,
  buildTechnicianAssignOptions,
} from "@/lib/select-option-builders";

const STATUS_OPTIONS = Object.entries(STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}));

const PRIORITY_OPTIONS = [
  { value: "low", label: "منخفض" },
  { value: "normal", label: "عادي" },
  { value: "high", label: "عالي" },
];

const SERVICE_TYPE_OPTIONS = Object.entries(SERVICE_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = parseListFilters(await searchParams);
  const [allOrders, technicians] = await Promise.all([
    getAllServiceRequests(),
    getTechnicians(),
  ]);
  const orders = filterServiceRequests(allOrders, params);
  const statusOptions = buildStatusSelectOptions();
  const priorityOptions = buildPrioritySelectOptions();
  const technicianOptions = buildTechnicianAssignOptions(technicians);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">إدارة الطلبات</h1>

      <DashboardFilterBar
        pathname="/admin/orders"
        values={params}
        searchPlaceholder="اسم العميل، الهاتف، السيارة، رمز التتبع..."
        selects={[
          { name: "status", label: "الحالة", options: STATUS_OPTIONS },
          { name: "priority", label: "الأولوية", options: PRIORITY_OPTIONS },
          {
            name: "service_type",
            label: "نوع الخدمة",
            options: SERVICE_TYPE_OPTIONS,
          },
        ]}
        resultCount={orders.length}
        totalCount={allOrders.length}
      />

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.customer_name}</p>
                  <p className="text-sm text-muted" dir="ltr">
                    {order.customer_phone}
                  </p>
                  <p className="mt-1 text-sm">
                    {SERVICE_TYPE_LABELS[order.service_type]} ·{" "}
                    {order.car_type ?? "—"}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
                  </Badge>
                  <Badge variant="outline">{order.priority}</Badge>
                  <span className="text-xs text-muted" dir="ltr">
                    {order.tracking_token}
                  </span>
                </div>
              </div>

              <form action={updateOrderAction} className="grid gap-3 md:grid-cols-4">
                <input type="hidden" name="id" value={order.id} />
                <IconSelect
                  name="status"
                  options={statusOptions}
                  defaultValue={order.status}
                />
                <IconSelect
                  name="priority"
                  options={priorityOptions}
                  defaultValue={order.priority}
                />
                <IconSelect
                  name="assigned_technician_id"
                  options={technicianOptions}
                  defaultValue={order.assigned_technician_id ?? ""}
                />
                <Button type="submit" variant="default" className="h-11">
                  حفظ
                </Button>
              </form>
            </CardContent>
          </Card>
        ))}

        {orders.length === 0 && (
          <p className="text-center text-muted">
            {allOrders.length === 0
              ? "لا توجد طلبات بعد."
              : "لا توجد نتائج مطابقة للتصفية."}
          </p>
        )}
      </div>
    </div>
  );
}
