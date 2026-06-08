"use client";

import type { RequestStatusHistory, ServiceRequest } from "@service-time/types";
import Link from "next/link";
import { ArrowLeft, Navigation } from "lucide-react";
import {
  RequestSummary,
  TrackingTimeline,
} from "@/components/tracking/tracking-timeline";
import { LiveTechnicianMap } from "@/components/tracking/live-technician-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getStatusLabels } from "@/lib/i18n/labels";
import { useLocale } from "@/lib/i18n/locale-context";

type ClientLatestTrackingSectionProps = {
  order: ServiceRequest | null;
  history: RequestStatusHistory[];
  initialTechnicianCoords?: { lat: number; lng: number } | null;
};

export function ClientLatestTrackingSection({
  order,
  history,
  initialTechnicianCoords = null,
}: ClientLatestTrackingSectionProps) {
  const { messages: t, locale } = useLocale();
  const statusLabels = getStatusLabels(t);

  if (!order) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Navigation className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
            <div>
              <h2 className="font-semibold">{t.dashboard.client.latestTracking.title}</h2>
              <p className="mt-1 text-sm text-muted">
                {t.dashboard.client.latestTracking.empty}
              </p>
            </div>
          </div>
          <Link
            href="/client/request"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            {t.dashboard.client.requestFirst}
          </Link>
        </CardContent>
      </Card>
    );
  }

  const showLiveMap =
    order.status === "on_the_way" || order.status === "arrived";
  const isActive =
    order.status !== "completed" && order.status !== "cancelled";

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {t.dashboard.client.latestTracking.title}
              </h2>
              {isActive ? (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {t.dashboard.client.latestTracking.activeBadge}
                </Badge>
              ) : null}
            </div>
            <p className="text-sm text-muted">
              {t.dashboard.client.latestTracking.subtitle}{" "}
              <span className="font-medium text-foreground">
                {new Date(order.created_at).toLocaleDateString(locale)}
              </span>
              {" · "}
              <span className="font-medium text-foreground">
                {statusLabels[order.status as keyof typeof statusLabels]}
              </span>
            </p>
          </div>
          <Link
            href={`/client/track/${order.tracking_token}`}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition-colors hover:bg-primary/5"
          >
            {t.dashboard.client.latestTracking.viewFull}
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>

        <RequestSummary request={order} />

        <div className="rounded-2xl border border-border bg-background/50 p-5">
          <h3 className="mb-5 font-semibold">{t.tracking.timelineTitle}</h3>
          <TrackingTimeline currentStatus={order.status} history={history} />
        </div>

        <LiveTechnicianMap
          show={showLiveMap}
          technicianId={order.assigned_technician_id}
          destination={
            order.location_lat != null && order.location_lng != null
              ? { lat: order.location_lat, lng: order.location_lng }
              : null
          }
          destinationAddress={order.location_text}
          initialCoords={initialTechnicianCoords}
        />
      </CardContent>
    </Card>
  );
}
