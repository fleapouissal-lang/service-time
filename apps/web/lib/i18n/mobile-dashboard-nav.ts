import type { ProfileRole } from "@service-time/types";
import type { DashboardNavItem } from "@/components/dashboard/dashboard-sidebar";
import type { Messages } from "@/messages/types";
import {
  getAdminNav,
  getClientNav,
  getTechnicianNav,
} from "@/lib/i18n/dashboard-nav";
import { getProfileHomePath } from "@/lib/profile-home";

export type DashboardMobileNavSplit = {
  primary: DashboardNavItem[];
  overflow: DashboardNavItem[];
  center?: DashboardNavItem;
};

function withoutMobileBarItems(
  items: DashboardNavItem[],
  role: ProfileRole,
): DashboardNavItem[] {
  const home = getProfileHomePath(role);
  const excluded = new Set([
    ...(role !== "technician" ? [`${home}/settings`] : []),
    ...(role === "client" ? [`${home}/track`] : []),
  ]);
  return items.filter((item) => !excluded.has(item.href));
}

export function getDashboardRoleFromPath(
  pathname: string,
): ProfileRole | null {
  if (pathname.startsWith("/admin")) return "admin";
  if (pathname.startsWith("/technician")) return "technician";
  if (pathname.startsWith("/client")) return "client";
  return null;
}

export function isDashboardNavActive(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    (href !== "/admin" &&
      href !== "/technician" &&
      href !== "/client" &&
      pathname.startsWith(href))
  );
}

export function getDashboardMobileNav(
  role: ProfileRole,
  messages: Messages,
): DashboardMobileNavSplit {
  const all =
    role === "admin"
      ? getAdminNav(messages)
      : role === "technician"
        ? getTechnicianNav(messages)
        : getClientNav(messages);

  const items = withoutMobileBarItems(all, role);

  if (role === "admin") {
    const home = getProfileHomePath(role);
    const center = items.find((item) => item.href === home);
    const primaryHrefs = [
      "/admin/orders",
      "/admin/spare-part-orders",
    ];
    return {
      primary: items.filter((item) => primaryHrefs.includes(item.href)),
      overflow: items.filter(
        (item) =>
          !primaryHrefs.includes(item.href) && item.href !== home,
      ),
      center,
    };
  }

  if (role === "client") {
    const home = getProfileHomePath(role);
    const center = items.find((item) => item.href === home);
    const primary = items.filter((item) => item.href !== home);
    return {
      primary,
      overflow: [],
      center,
    };
  }

  if (role === "technician") {
    const home = getProfileHomePath(role);
    const center = items.find((item) => item.href === home);
    const primaryHrefs = [
      "/technician/orders",
      "/technician/location",
      "/technician/settings",
      "/contact",
    ];
    return {
      primary: items.filter((item) => primaryHrefs.includes(item.href)),
      overflow: [],
      center,
    };
  }

  return { primary: items, overflow: [] };
}
