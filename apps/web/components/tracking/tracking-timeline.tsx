"use client";

import type { RequestStatusHistory } from "@service-time/types";
import { CheckCircle2, Circle, MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  getExecutionMethodLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { STATUS_ORDER } from "@/lib/constants";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export function TrackingTimeline({
  currentStatus,
  history,
}: {
  currentStatus: string;
  history: RequestStatusHistory[];
}) {
  const { messages: t, locale } = useLocale();
  const statusLabels = getStatusLabels(t);
  const historyStatuses = new Set(history.map((h) => h.status as string));
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <Badge variant="outline" className="text-red-600">
        {statusLabels.cancelled}
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
                {statusLabels[status]}
              </p>
              {history
                .filter((h) => h.status === status)
                .map((h) => (
                  <p key={h.id} className="mt-1 text-xs text-muted">
                    {new Date(h.created_at).toLocaleString(locale)}
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
  const { messages: t } = useLocale();
  if (!show || lat == null || lng == null) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <MapPin className="size-5 shrink-0" />
          <p>
            {t.tracking.mapPlaceholder}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <iframe
        title={t.tracking.mapTitle}
        src={`https://maps.google.com/maps?q=${lat},${lng}&z=14&output=embed`}
        className="h-64 w-full rounded-2xl border border-border"
        loading="lazy"
      />
      <p className="text-xs text-muted">
        {t.tracking.mapDisclaimer}
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
    service_type: string;
    execution_method: string;
    status: string;
    tracking_token: string;
  };
}) {
  const { messages: t } = useLocale();
  const serviceTypeLabels = getServiceTypeLabels(t);
  const executionMethodLabels = getExecutionMethodLabels(t);
  const statusLabels = getStatusLabels(t);
  return (
    <Card>
      <CardContent className="grid gap-3 p-6 sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted">{t.tracking.summary.customer}</p>
          <p className="font-semibold">{request.customer_name}</p>
        </div>
        <div>
          <p className="text-xs text-muted">{t.tracking.summary.car}</p>
          <p className="font-semibold">{request.car_type ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-muted">{t.tracking.summary.serviceType}</p>
          <p className="font-semibold">
            {serviceTypeLabels[request.service_type as keyof typeof serviceTypeLabels]}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">{t.tracking.summary.executionMethod}</p>
          <p className="font-semibold">
            {executionMethodLabels[request.execution_method as keyof typeof executionMethodLabels]}
          </p>
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs text-muted">{t.tracking.summary.trackingToken}</p>
          <p className="font-mono text-sm" dir="ltr">
            {request.tracking_token}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">{t.tracking.summary.currentStatus}</p>
          <Badge variant="secondary">{statusLabels[request.status as keyof typeof statusLabels]}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
