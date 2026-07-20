"use client";

import Link from "next/link";
import { Eye, MapPin } from "lucide-react";
import { useState } from "react";
import type {
  ClientVehicle,
  ExecutionMethod,
  ServiceRequest,
  ServiceRequestStatus,
  ServiceType,
} from "@service-time/types";
import {
  AdminTable,
  AdminTableCell,
  AdminTableHead,
  AdminTableHeadCell,
} from "@/components/admin/admin-table";
import { DashboardDetailDialog } from "@/components/dashboard/dashboard-detail-dialog";
import { DashboardTablePagination } from "@/components/dashboard/dashboard-table-pagination";
import { VehicleBrandLogo } from "@/components/client/vehicles/vehicle-brand-logo";
import { ServiceRequestPhotosGallery } from "@/components/service-requests/service-request-photos-panel";
import { Badge } from "@/components/ui/badge";
import { useDashboardTablePagination } from "@/hooks/use-dashboard-table-pagination";
import {
  getVehicleBrandLogo,
  getVehicleDisplayName,
} from "@/lib/client-vehicle-display";
import { formatDateTime } from "@/lib/format-datetime";
import { useLocale } from "@/lib/i18n/locale-context";
import type { RequestPhotoRow } from "@/lib/request-photos-queries";
import { cn } from "@/lib/utils";
import {
  getLocalizedColorName,
  VEHICLE_COLOR_OPTIONS,
} from "@/lib/vehicle-catalog";

type ClientOrdersTableProps = {
  orders: ServiceRequest[];
  photoCounts: Record<string, number>;
  photosByRequestId: Record<string, RequestPhotoRow[]>;
  vehicles?: ClientVehicle[];
  statusLabels: Record<ServiceRequestStatus, string>;
  serviceTypeLabels: Record<ServiceType, string>;
  executionMethodLabels: Record<ExecutionMethod, string>;
};

const actionBtnClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted transition-colors hover:bg-primary/5 hover:text-primary";

export function ClientOrdersTable({
  orders,
  photoCounts,
  photosByRequestId,
  vehicles = [],
  statusLabels,
  serviceTypeLabels,
  executionMethodLabels,
}: ClientOrdersTableProps) {
  const { locale, messages: t } = useLocale();
  const p = t.dashboard.client.ordersPage;
  const v = t.clientVehicles;
  const {
    pageItems,
    setPage,
    page,
    totalPages,
    totalItems,
    from,
    to,
  } = useDashboardTablePagination(orders);
  const [viewTarget, setViewTarget] = useState<ServiceRequest | null>(null);

  const viewVehicle = viewTarget?.car_type
    ? vehicles.find((vehicle) => vehicle.label === viewTarget.car_type)
    : undefined;

  const vehicleColorName = (() => {
    if (!viewVehicle?.color) return null;
    const option = VEHICLE_COLOR_OPTIONS.find(
      (item) => item.id === viewVehicle.color,
    );
    return option
      ? getLocalizedColorName(option, locale)
      : viewVehicle.color;
  })();

  const vehicleColorHex = viewVehicle?.color
    ? VEHICLE_COLOR_OPTIONS.find((item) => item.id === viewVehicle.color)?.hex ?? null
    : null;

  const vehiclePlate =
    viewVehicle && (viewVehicle.plate_letters || viewVehicle.plate_number)
      ? [viewVehicle.plate_number, viewVehicle.plate_letters]
          .filter(Boolean)
          .join(" ")
      : null;

  return (
    <>
      <AdminTable className="min-w-[880px]">
        <AdminTableHead>
          <AdminTableHeadCell>{p.table.service}</AdminTableHeadCell>
          <AdminTableHeadCell>{p.table.execution}</AdminTableHeadCell>
          <AdminTableHeadCell className="min-w-[9rem]">{p.table.location}</AdminTableHeadCell>
          <AdminTableHeadCell align="center">{t.common.status}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[7rem]">
            {p.table.tracking}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center">{p.table.photo}</AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="min-w-[9rem]">
            {p.table.date}
          </AdminTableHeadCell>
          <AdminTableHeadCell align="center" className="w-28">
            {p.table.actions}
          </AdminTableHeadCell>
        </AdminTableHead>
        <tbody>
          {pageItems.map((order) => {
            const trackHref = `/client/track/${order.tracking_token}`;

            return (
              <tr key={order.id} className="border-b border-border">
                <AdminTableCell>
                  <span className="block font-semibold leading-snug">
                    {serviceTypeLabels[order.service_type]}
                  </span>
                </AdminTableCell>
                <AdminTableCell className="text-muted">
                  {executionMethodLabels[order.execution_method]}
                </AdminTableCell>
                <AdminTableCell className="min-w-[9rem] max-w-[14rem]">
                  <span className="line-clamp-2 text-muted">
                    {order.location_text ?? t.common.dash}
                  </span>
                </AdminTableCell>
                <AdminTableCell align="center">
                  <Badge variant="secondary" className="whitespace-nowrap">
                    {statusLabels[order.status as ServiceRequestStatus]}
                  </Badge>
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[7rem]">
                  <span
                    className="mx-auto block max-w-[7rem] truncate font-mono text-xs"
                    title={order.tracking_token}
                  >
                    {order.tracking_token}
                  </span>
                </AdminTableCell>
                <AdminTableCell align="center">
                  {(photoCounts[order.id] ?? 0) > 0 ? (
                    <Badge variant="secondary">{t.common.yes}</Badge>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </AdminTableCell>
                <AdminTableCell ltr className="min-w-[9rem]">
                  {formatDateTime(order.created_at, locale)}
                </AdminTableCell>
                <AdminTableCell align="center" className="w-28">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewTarget(order)}
                      className={actionBtnClass}
                      title={p.table.view}
                      aria-label={p.table.view}
                    >
                      <Eye className="size-4" aria-hidden />
                    </button>
                    <Link
                      href={trackHref}
                      className={cn(actionBtnClass)}
                      title={p.table.track}
                      aria-label={p.table.track}
                    >
                      <MapPin className="size-4" aria-hidden />
                    </Link>
                  </div>
                </AdminTableCell>
              </tr>
            );
          })}
        </tbody>
      </AdminTable>

      <DashboardDetailDialog
        open={Boolean(viewTarget)}
        wide
        eyebrow={p.table.view}
        title={
          viewTarget ? serviceTypeLabels[viewTarget.service_type] : ""
        }
        onClose={() => setViewTarget(null)}
        closeLabel={t.common.close}
        fields={
          viewTarget
            ? [
                {
                  label: p.table.service,
                  value: serviceTypeLabels[viewTarget.service_type],
                },
                {
                  label: p.table.execution,
                  value: executionMethodLabels[viewTarget.execution_method],
                },
                {
                  label: t.common.status,
                  value: (
                    <Badge variant="secondary">
                      {statusLabels[viewTarget.status as ServiceRequestStatus]}
                    </Badge>
                  ),
                },
                {
                  label: p.table.tracking,
                  value: viewTarget.tracking_token,
                  ltr: true,
                },
                {
                  label: p.table.date,
                  value: formatDateTime(viewTarget.created_at, locale),
                  ltr: true,
                },
                ...(viewTarget.location_text
                  ? [
                      {
                        label: p.table.location,
                        value: viewTarget.location_text,
                        fullWidth: true,
                      },
                    ]
                  : []),
                ...(viewVehicle
                  ? [
                      {
                        label: t.common.car,
                        fullWidth: true,
                        value: (
                          <div className="flex items-center gap-3">
                            <VehicleBrandLogo
                              src={getVehicleBrandLogo(viewVehicle)}
                              alt={getVehicleDisplayName(viewVehicle, locale)}
                              size="sm"
                            />
                            <span className="font-semibold">
                              {getVehicleDisplayName(viewVehicle, locale)}
                            </span>
                          </div>
                        ),
                      },
                      ...(vehicleColorName
                        ? [
                            {
                              label: v.color,
                              value: (
                                <span className="inline-flex items-center gap-2">
                                  {vehicleColorHex ? (
                                    <span
                                      className="inline-block size-3.5 rounded-full border border-white/30"
                                      style={{ backgroundColor: vehicleColorHex }}
                                      aria-hidden
                                    />
                                  ) : null}
                                  {vehicleColorName}
                                </span>
                              ),
                            },
                          ]
                        : []),
                      ...(viewVehicle.year
                        ? [
                            {
                              label: v.year,
                              value: String(viewVehicle.year),
                              ltr: true,
                            },
                          ]
                        : []),
                      ...(vehiclePlate
                        ? [{ label: v.plateNumber, value: vehiclePlate, ltr: true }]
                        : []),
                      ...(viewVehicle.chassis_number
                        ? [
                            {
                              label: v.chassisNumber,
                              value: viewVehicle.chassis_number,
                              ltr: true,
                            },
                          ]
                        : []),
                    ]
                  : viewTarget.car_type
                    ? [
                        {
                          label: t.common.car,
                          value: viewTarget.car_type,
                          fullWidth: true,
                        },
                      ]
                    : []),
                ...(viewTarget.description
                  ? [
                      {
                        label: t.common.description,
                        value: viewTarget.description,
                        fullWidth: true,
                      },
                    ]
                  : []),
                ...((photosByRequestId[viewTarget.id] ?? []).length > 0
                  ? [
                      {
                        label: p.table.photo,
                        value: (
                          <ServiceRequestPhotosGallery
                            requestId={viewTarget.id}
                            photos={photosByRequestId[viewTarget.id] ?? []}
                          />
                        ),
                        fullWidth: true,
                      },
                    ]
                  : []),
              ]
            : []
        }
      />

      <DashboardTablePagination
        page={page}
        totalPages={totalPages}
        totalItems={totalItems}
        from={from}
        to={to}
        onPageChange={setPage}
      />
    </>
  );
}
