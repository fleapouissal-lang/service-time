import type { RequestStatusHistory } from "@service-time/types";
import { CheckCircle2, Circle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  EXECUTION_METHOD_LABELS,
  SERVICE_TYPE_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TrackingTimeline({
  currentStatus,
  history,
}: {
  currentStatus: string;
  history: RequestStatusHistory[];
}) {
  const historyStatuses = new Set(history.map((h) => h.status as string));
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <Badge variant="outline" className="text-red-600">
        {STATUS_LABELS.cancelled}
      </Badge>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number],
  );

  return (
    <ol className="space-y-0">
      {STATUS_ORDER.map((status, index) => {
        const done =
          historyStatuses.has(status) ||
          index <= currentIndex;
        const active = status === currentStatus;

        return (
          <li key={status} className="flex gap-4">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle2
                  className={cn(
                    "size-6",
                    active ? "text-primary" : "text-muted",
                  )}
                />
              ) : (
                <Circle className="size-6 text-slate-300" />
              )}
              {index < STATUS_ORDER.length - 1 && (
                <div
                  className={cn(
                    "my-1 w-0.5 flex-1 min-h-[32px]",
                    done ? "bg-primary/40" : "bg-slate-200",
                  )}
                />
              )}
            </div>
            <div className="pb-8">
              <p
                className={cn(
                  "font-semibold",
                  active && "text-primary",
                  !done && "text-slate-400",
                )}
              >
                {STATUS_LABELS[status]}
              </p>
              {history
                .filter((h) => h.status === status)
                .map((h) => (
                  <p key={h.id} className="mt-1 text-xs text-muted">
                    {new Date(h.created_at).toLocaleString("ar-SA")}
                  </p>
                ))}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function TrackingMapPlaceholder({
  lat,
  lng,
  show,
}: {
  lat: number | null;
  lng: number | null;
  show: boolean;
}) {
  if (!show || lat == null || lng == null) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <MapPin className="size-5 shrink-0" />
          <p>
            سيظهر موقع الفني على الخريطة عندما تكون حالة الطلب «الفني في
            الطريق».
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        title="موقع الفني"
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
        className="h-64 w-full rounded-2xl border border-border"
        loading="lazy"
      />
      <p className="text-xs text-muted">
        * الموقع تقريبي ويعتمد على اتصال الفني بالإنترنت — ليس التزاماً بوقت
        وصول دقيق.
      </p>
    </div>
  );
}

export function RequestSummary({
  request,
}: {
  request: {
    customer_name: string;
    car_type: string | null;
    service_type: keyof typeof SERVICE_TYPE_LABELS;
    execution_method: keyof typeof EXECUTION_METHOD_LABELS;
    status: keyof typeof STATUS_LABELS;
    tracking_token: string;
  };
}) {
  return (
    <Card>
      <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">العميل</p>
          <p className="font-semibold">{request.customer_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">السيارة</p>
          <p className="font-semibold">{request.car_type ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">نوع الخدمة</p>
          <p className="font-semibold">
            {SERVICE_TYPE_LABELS[request.service_type]}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">طريقة التنفيذ</p>
          <p className="font-semibold">
            {EXECUTION_METHOD_LABELS[request.execution_method]}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted">رمز التتبع</p>
          <p className="font-mono text-sm" dir="ltr">
            {request.tracking_token}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">الحالة الحالية</p>
          <Badge variant="secondary">{STATUS_LABELS[request.status]}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
