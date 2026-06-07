import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
} from "@/lib/constants";
import {
  getRequestById,
  getRequestStatusHistory,
} from "@/lib/dashboard-queries";

export default async function ClientOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getRequestById(id);

  if (!order) notFound();

  const history = await getRequestStatusHistory(id);

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/orders"
          className="text-sm text-primary hover:underline"
        >
          ← العودة للطلبات
        </Link>
        <h1 className="mt-3 text-2xl font-bold">تفاصيل الطلب</h1>
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary">
              {STATUS_LABELS[order.status as keyof typeof STATUS_LABELS]}
            </Badge>
            <span className="text-sm text-muted">
              {new Date(order.created_at).toLocaleString("ar-SA")}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm text-muted">نوع الخدمة</p>
              <p className="font-medium">
                {SERVICE_TYPE_LABELS[order.service_type]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">طريقة التنفيذ</p>
              <p className="font-medium">
                {EXECUTION_METHOD_LABELS[order.execution_method]}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">الموقع</p>
              <p className="font-medium">{order.location_text ?? "—"}</p>
            </div>
            <div>
              <p className="text-sm text-muted">نوع السيارة</p>
              <p className="font-medium">{order.car_type ?? "—"}</p>
            </div>
          </div>

          {order.description ? (
            <div>
              <p className="text-sm text-muted">الوصف</p>
              <p className="mt-1 whitespace-pre-wrap">{order.description}</p>
            </div>
          ) : null}

          <Link
            href={`/client/track/${order.tracking_token}`}
            className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            تتبع الطلب مباشرة
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-semibold">سجل الحالة</h2>
          {history.length === 0 ? (
            <p className="text-sm text-muted">لا يوجد سجل بعد.</p>
          ) : (
            <ol className="space-y-3">
              {history.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <span className="font-medium">
                    {
                      STATUS_LABELS[
                        entry.status as keyof typeof STATUS_LABELS
                      ]
                    }
                  </span>
                  <span className="text-muted">
                    {new Date(entry.created_at).toLocaleString("ar-SA")}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
