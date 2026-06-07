import type { Messages } from "@/messages/types";
import {
  buildSparePartOrderStatusOptions,
  getSparePartOrderStatusLabels,
  getSparePartPaymentMethodLabels,
  getSparePartPaymentStatusLabels,
} from "@/lib/i18n/labels";

export function getSparePartOrderStatusLabelsForDashboard(t: Messages) {
  return getSparePartOrderStatusLabels(t);
}

export function getSparePartPaymentStatusLabelsForDashboard(t: Messages) {
  return getSparePartPaymentStatusLabels(t);
}

export function getSparePartPaymentMethodLabelsForDashboard(t: Messages) {
  return getSparePartPaymentMethodLabels(t);
}

export function buildSparePartOrderStatusOptionsForDashboard(t: Messages) {
  return buildSparePartOrderStatusOptions(t);
}
