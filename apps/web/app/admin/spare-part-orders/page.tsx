import { updateSparePartOrderStatusAction } from "@/app/spare-parts/actions";
import { IconSelect } from "@/components/ui/icon-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SPARE_PART_ORDER_STATUS_LABELS } from "@/lib/spare-part-order-labels";
import { buildSparePartOrderStatusOptions } from "@/lib/spare-part-order-labels";
import { getAdminSparePartOrders } from "@/lib/spare-part-orders-queries";
import { formatSparePartPrice, getLineTotal } from "@/lib/format-price";

export default async function AdminSparePartOrdersPage() {
  const orders = await getAdminSparePartOrders();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">طلبات قطع الغيار</h1>
        <p className="text-muted">إدارة الطلبات من متجر /spare-parts</p>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted">لا توجد طلبات بعد.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const orderTotal = order.items.reduce(
              (sum, item) =>
                sum + getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
              0,
            );

            return (
            <Card key={order.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {order.client?.full_name ?? "—"}
                    </p>
                    <p className="text-sm text-muted" dir="ltr">
                      {order.client?.phone ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted" dir="ltr">
                      {order.order_token}
                    </p>
                  </div>
                  <div className="text-end text-sm text-muted">
                    <Badge variant="secondary">
                      {SPARE_PART_ORDER_STATUS_LABELS[order.status]}
                    </Badge>
                    <p className="mt-2">
                      {new Date(order.created_at).toLocaleString("ar-SA")}
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 rounded-xl border border-border p-3 text-sm">
                  {order.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span>
                        {item.name_snapshot}
                        <span className="ms-2 text-muted" dir="ltr">
                          ({formatSparePartPrice(Number(item.price_snapshot) || 0)})
                        </span>
                      </span>
                      <span className="font-semibold" dir="ltr">
                        × {item.quantity} —{" "}
                        {formatSparePartPrice(
                          getLineTotal(Number(item.price_snapshot) || 0, item.quantity),
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-semibold" dir="ltr">
                  المجموع: {formatSparePartPrice(orderTotal)}
                </p>

                {order.notes ? (
                  <p className="text-sm text-muted">
                    <span className="font-medium text-foreground">ملاحظات: </span>
                    {order.notes}
                  </p>
                ) : null}

                <form
                  action={updateSparePartOrderStatusAction}
                  className="flex flex-wrap items-end gap-3"
                >
                  <input type="hidden" name="id" value={order.id} />
                  <div className="min-w-[200px] flex-1">
                    <IconSelect
                      name="status"
                      options={buildSparePartOrderStatusOptions()}
                      defaultValue={order.status}
                    />
                  </div>
                  <Button type="submit" className="h-11">
                    تحديث الحالة
                  </Button>
                </form>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
