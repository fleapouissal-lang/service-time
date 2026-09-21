import Link from "next/link";
import { Suspense } from "react";
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { AdminCreateOrderForm } from "@/components/admin/admin-create-order-form";
import { AdminOrdersFilters } from "@/components/admin/admin-orders-filters";
import { AdminOrdersTable } from "@/components/admin/admin-orders-table";
import { AdminSparePartOrdersTable } from "@/components/admin/admin-spare-part-orders-table";
import { Card, CardContent } from "@/components/ui/card";
import { getPlatformUsers } from "@/lib/admin-dashboard-data";
import {
  parseAdminOrderSection,
  sparePartOrderNeedsAction,
} from "@/lib/admin-order-sections";
import {
  getAllServiceRequests,
  getTechnicians,
} from "@/lib/dashboard-queries";
import {
  getRequestPhotosByRequestIds,
  requestPhotoCountsFromMap,
} from "@/lib/request-photos-queries";
import {
  getPeriodFilterOptionsForDashboard,
  getPriorityFilterOptionsForDashboard,
  getStatusFilterOptionsForDashboard,
} from "@/lib/dashboard-filter-options";
import {
  buildExecutionMethodSelectOptions,
  buildPrioritySelectOptions,
  buildServiceRequestTypeOptions,
  buildTechnicianAssignOptions,
} from "@/lib/select-option-builders";
import {
  getPriorityLabels,
  getServiceTypeLabels,
  getStatusLabels,
} from "@/lib/i18n/labels";
import { getServerI18n } from "@/lib/i18n/server";
import {
  filterServiceRequests,
  filterSparePartOrders,
  parseListFilters,
} from "@/lib/list-filters";
import { getAdminSparePartOrders } from "@/lib/spare-part-orders-queries";
import {
  getSparePartOrderStatusFilterOptionsForDashboard,
  getSparePartOrderStatusLabelsForDashboard,
  getSparePartPaymentMethodLabelsForDashboard,
  getSparePartPaymentStatusLabelsForDashboard,
} from "@/lib/spare-part-order-labels";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import {
  getAdminServicesCatalog,
  toPublicCatalog,
} from "@/lib/services-catalog-admin";
import { getAdminVehicleClasses } from "@/lib/vehicle-classes-admin";

type PageProps = {
  searchParams: Promise<Record<string, string | undefined>>;
};

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const { t, locale } = await getServerI18n();
  const p = t.dashboard.admin.ordersPage;
  const params = parseListFilters(await searchParams);
  const section = parseAdminOrderSection(params.section);
  const isSpareSection = section === "spare_parts";
  const needsActionOnly =
    params.needs_action === "1" || params.needs_action === "true";
  const arMessages = getDictionary("ar");
  const enMessages = getDictionary("en");

  const [allOrders, clients, technicians, allSpareOrders, adminCatalog, vehicleClasses] =
    await Promise.all([
      getAllServiceRequests(),
      getPlatformUsers("client"),
      getTechnicians(),
      getAdminSparePartOrders(),
      getAdminServicesCatalog(
        arMessages.services.catalog,
        enMessages.services.catalog,
      ),
      getAdminVehicleClasses(),
    ]);
  const catalogCategories = toPublicCatalog(adminCatalog, locale);

  const spareFiltered = filterSparePartOrders(allSpareOrders, {
    ...params,
    service_type: undefined,
    priority: undefined,
  });
  const spareRows = needsActionOnly
    ? spareFiltered.filter(sparePartOrderNeedsAction)
    : spareFiltered;

  const orders = isSpareSection ? [] : filterServiceRequests(allOrders, params);

  const photosByRequestId = isSpareSection
    ? {}
    : await getRequestPhotosByRequestIds(orders.map((order) => order.id));
  const photoCounts = requestPhotoCountsFromMap(photosByRequestId);
  const statusLabels = getStatusLabels(t);
  const serviceTypeLabels = getServiceTypeLabels(t);
  const priorityLabels = getPriorityLabels(t);
  const serviceTypeOptions = buildServiceRequestTypeOptions(t);
  const executionMethodOptions = buildExecutionMethodSelectOptions(t);
  const priorityOptions = buildPrioritySelectOptions(t);
  const technicianOptions = buildTechnicianAssignOptions(
    t,
    technicians,
    locale,
  );
  const spareStatusLabels = getSparePartOrderStatusLabelsForDashboard(t);
  const paymentMethodLabels =
    getSparePartPaymentMethodLabelsForDashboard(t);
  const paymentStatusLabels =
    getSparePartPaymentStatusLabelsForDashboard(t);

  return (
    <div className="space-y-8">
      <DashboardPageHeader title={t.dashboard.admin.orders}>
        <p className="text-muted">{p.subtitle}</p>
      </DashboardPageHeader>

      <Suspense>
        <AdminOrdersFilters
          values={params}
          section={section}
          sectionLabels={p.sections}
          statusOptions={
            isSpareSection
              ? getSparePartOrderStatusFilterOptionsForDashboard(t)
              : getStatusFilterOptionsForDashboard(t)
          }
          priorityOptions={getPriorityFilterOptionsForDashboard(t)}
          periodOptions={getPeriodFilterOptionsForDashboard(t)}
          isSpareSection={isSpareSection}
          searchPlaceholder={p.searchPlaceholder}
          requestTypeLabel={p.requestType}
          needsActionLabel={p.needsAction}
          needsActionOptionLabel={p.needsActionFilter}
          showMoreLabel={p.showMoreFilters}
          showLessLabel={p.showLessFilters}
          resultCount={isSpareSection ? spareRows.length : orders.length}
          totalCount={
            isSpareSection ? allSpareOrders.length : allOrders.length
          }
        />
      </Suspense>

      {isSpareSection ? (
        <Card>
          <CardContent className="space-y-4 p-4 sm:p-6">
            <p className="text-sm text-muted">{p.sparePartsHint}</p>
            <Link
              href="/admin/spare-part-orders"
              className="inline-flex text-sm font-semibold text-primary underline-offset-4 hover:underline"
            >
              {p.openSparePartsQueue}
            </Link>
            {spareRows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted">
                {allSpareOrders.length === 0
                  ? t.common.noData
                  : t.common.noResultsFiltered}
              </p>
            ) : (
              <div className="-mx-4 sm:-mx-6">
                <AdminSparePartOrdersTable
                  orders={spareRows}
                  statusLabels={spareStatusLabels}
                  paymentMethodLabels={paymentMethodLabels}
                  paymentStatusLabels={paymentStatusLabels}
                />
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <AdminCreateOrderForm
            clients={clients}
            serviceTypeOptions={serviceTypeOptions}
            executionMethodOptions={executionMethodOptions}
            priorityOptions={priorityOptions}
            technicianOptions={technicianOptions}
            catalogCategories={catalogCategories}
            vehicleClasses={vehicleClasses}
          />

          <Card>
            <CardContent className="p-0">
              {orders.length === 0 ? (
                <p className="p-6 text-center text-sm text-muted">
                  {allOrders.length === 0
                    ? t.common.noData
                    : t.common.noResultsFiltered}
                </p>
              ) : (
                <AdminOrdersTable
                  orders={orders}
                  photoCounts={photoCounts}
                  photosByRequestId={photosByRequestId}
                  statusLabels={statusLabels}
                  serviceTypeLabels={serviceTypeLabels}
                  priorityLabels={priorityLabels}
                />
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
