import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { SPARE_PART_ORDER_STATUS_LABELS } from "@/lib/spare-part-order-labels";
import { getClientSparePartOrders } from "@/lib/spare-part-orders-queries";

export default async function ClientSparePartOrdersPage() {
  const profile = await requireProfile(["client"]);
  if (!profile) return null;

  const orders = await getClientSparePartOrders(profile.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">طلبات قطع الغيار</h1>
          <p className="text-muted">متابعة طلباتك من المتجر</p>
        </div>
        <Link
          href="/spare-parts"
          className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          تصفح القطع
        </Link>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted">لا توجد طلبات بعد.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold" dir="ltr">
                    {order.order_token}
                  </p>
                  <p className="mt-1 text-sm text-muted">
                    {new Date(order.created_at).toLocaleString("ar-SA")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {SPARE_PART_ORDER_STATUS_LABELS[order.status]}
                  </Badge>
                  <Link
                    href={`/client/spare-part-orders/${order.id}`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    التفاصيل
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
