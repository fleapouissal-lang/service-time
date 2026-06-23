import type { Messages } from "@/messages/types";
import {
  getActiveFilterOptions,
  getExecutionMethodFilterOptions,
  getPeriodFilterOptions,
  getPriorityFilterOptions,
  getRoleFilterOptions,
  getServiceTypeFilterOptions,
  getStatusFilterOptions,
} from "@/lib/i18n/labels";

export function getStatusFilterOptionsForDashboard(t: Messages) {
  return getStatusFilterOptions(t);
}

export function getPriorityFilterOptionsForDashboard(t: Messages) {
  return getPriorityFilterOptions(t);
}

export function getServiceTypeFilterOptionsForDashboard(t: Messages) {
  return getServiceTypeFilterOptions(t);
}

export function getExecutionMethodFilterOptionsForDashboard(t: Messages) {
  return getExecutionMethodFilterOptions(t);
}

export function getPeriodFilterOptionsForDashboard(t: Messages) {
  return getPeriodFilterOptions(t);
}

export function getActiveFilterOptionsForDashboard(t: Messages) {
  return getActiveFilterOptions(t);
}

export function getRoleFilterOptionsForDashboard(t: Messages) {
  return getRoleFilterOptions(t);
}

export function getOrderSearchPlaceholder(t: Messages) {
  return t.dashboard.filters.orderSearch;
}

export function getClientOrderSearchPlaceholder(t: Messages) {
  return t.dashboard.filters.clientOrderSearch;
}

export function getClientSparePartOrderSearchPlaceholder(t: Messages) {
  return t.dashboard.filters.clientSparePartOrderSearch;
}

export function getAdminSparePartOrderSearchPlaceholder(t: Messages) {
  return t.dashboard.filters.adminSparePartOrderSearch;
}

export function getUserSearchPlaceholderForDashboard(t: Messages) {
  return t.dashboard.filters.userSearch;
}
