import type { InvoiceSourceType, InvoiceStatus } from "@service-time/types";
import type { Messages } from "@/messages/types";
import type { IconSelectOption } from "@/lib/icon-select-options";

export function getInvoiceStatusLabels(
  t: Messages,
): Record<InvoiceStatus, string> {
  return {
    pending: t.labels.invoiceStatus.pending,
    validated: t.labels.invoiceStatus.validated,
  };
}

export function getInvoiceSourceTypeLabels(
  t: Messages,
): Record<InvoiceSourceType, string> {
  return {
    service_request: t.labels.invoiceSourceType.service_request,
    spare_part_order: t.labels.invoiceSourceType.spare_part_order,
  };
}

export function getInvoiceStatusFilterOptions(
  t: Messages,
): IconSelectOption[] {
  const labels = getInvoiceStatusLabels(t);
  return [
    { value: "all", label: t.common.all },
    { value: "pending", label: labels.pending },
    { value: "validated", label: labels.validated },
  ];
}

export function getInvoiceSourceTypeFilterOptions(
  t: Messages,
): IconSelectOption[] {
  const labels = getInvoiceSourceTypeLabels(t);
  return [
    { value: "all", label: t.common.all },
    { value: "service_request", label: labels.service_request },
    { value: "spare_part_order", label: labels.spare_part_order },
  ];
}
