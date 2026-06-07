import type { Messages } from "@/messages/types";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-sidebar";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  MapPin,
  Package,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react";

export function getAdminNav(messages: Messages): DashboardNavItem[] {
  return [
    {
      href: "/admin",
      label: messages.dashboard.admin.overview,
      icon: LayoutDashboard,
    },
    {
      href: "/admin/orders",
      label: messages.dashboard.admin.orders,
      icon: ClipboardList,
    },
    {
      href: "/admin/services",
      label: messages.dashboard.admin.services,
      icon: Wrench,
    },
    {
      href: "/admin/spare-parts",
      label: messages.dashboard.admin.spareParts,
      icon: Package,
    },
    {
      href: "/admin/spare-part-orders",
      label: messages.dashboard.admin.sparePartOrders,
      icon: ShoppingCart,
    },
    {
      href: "/admin/users",
      label: messages.meta.adminUsers,
      icon: Users,
    },
    {
      href: "/admin/reports",
      label: messages.dashboard.admin.reports,
      icon: BarChart3,
    },
  ];
}

export function getTechnicianNav(messages: Messages): DashboardNavItem[] {
  return [
    {
      href: "/technician",
      label: messages.dashboard.technician.orders,
      icon: ClipboardList,
    },
    {
      href: "/technician/location",
      label: messages.dashboard.technician.location,
      icon: MapPin,
    },
  ];
}

export function getClientNav(messages: Messages): DashboardNavItem[] {
  return [
    {
      href: "/client",
      label: messages.dashboard.client.overview,
      icon: LayoutDashboard,
    },
    {
      href: "/client/orders",
      label: messages.dashboard.client.orders,
      icon: ClipboardList,
    },
    {
      href: "/client/spare-part-orders",
      label: messages.dashboard.client.sparePartOrders,
      icon: ShoppingCart,
    },
    {
      href: "/client/request",
      label: messages.dashboard.client.newRequest,
      icon: Wrench,
    },
    {
      href: "/client/track",
      label: messages.dashboard.client.track,
      icon: MapPin,
    },
  ];
}
