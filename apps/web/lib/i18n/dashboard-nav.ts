import type { Messages } from "@/messages/types";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-sidebar";
import {
  BarChart3,
  ClipboardList,
  LayoutDashboard,
  Mail,
  MapPin,
  Package,
  Settings,
  ShoppingCart,
  Users,
  Zap,
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
      href: "/admin/quick-requests",
      label: messages.dashboard.admin.quickRequests,
      icon: Zap,
    },
    {
      href: "/admin/locations",
      label: messages.dashboard.admin.locations,
      icon: MapPin,
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
    {
      href: "/admin/settings",
      label: messages.dashboard.settings.nav,
      icon: Settings,
    },
  ];
}

export function getTechnicianNav(messages: Messages): DashboardNavItem[] {
  return [
    {
      href: "/technician",
      label: messages.meta.technicianOverview,
      icon: LayoutDashboard,
    },
    {
      href: "/technician/orders",
      label: messages.meta.technicianOrders,
      icon: ClipboardList,
    },
    {
      href: "/technician/location",
      label: messages.meta.technicianLocation,
      icon: MapPin,
    },
    {
      href: "/technician/settings",
      label: messages.dashboard.settings.nav,
      icon: Settings,
    },
    {
      href: "/contact",
      label: messages.nav.contact,
      icon: Mail,
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
      href: "/client/quick-requests",
      label: messages.dashboard.client.quickRequests,
      icon: Zap,
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
    {
      href: "/client/settings",
      label: messages.dashboard.settings.nav,
      icon: Settings,
    },
  ];
}
