import type { LucideIcon } from "lucide-react";
import {
  Home,
  Info,
  Mail,
  MapPin,
  Package,
  Plus,
  Wrench,
} from "lucide-react";
import type { Messages } from "@/messages/types";

export type MobileBottomTab = {
  href: string;
  label: string;
  icon: LucideIcon;
  center?: boolean;
  match: (pathname: string) => boolean;
};

export type MobileMoreLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export function getMobileBottomTabs(messages: Messages): MobileBottomTab[] {
  return [
    {
      href: "/",
      label: messages.nav.home,
      icon: Home,
      match: (pathname) => pathname === "/",
    },
    {
      href: "/services",
      label: messages.nav.services,
      icon: Wrench,
      match: (pathname) =>
        pathname === "/services" || pathname.startsWith("/services/"),
    },
    {
      href: "/request",
      label: messages.nav.mobileRequest,
      icon: Plus,
      center: true,
      match: (pathname) =>
        pathname === "/request" || pathname.startsWith("/request/"),
    },
    {
      href: "/spare-parts",
      label: messages.nav.sparePartsShort,
      icon: Package,
      match: (pathname) =>
        pathname.startsWith("/spare-parts") &&
        !pathname.startsWith("/spare-parts/checkout"),
    },
  ];
}

export function getMobileMoreLinks(messages: Messages): MobileMoreLink[] {
  return [
    {
      href: "/locations",
      label: messages.nav.locations,
      icon: MapPin,
    },
    {
      href: "/about",
      label: messages.nav.about,
      icon: Info,
    },
    {
      href: "/contact",
      label: messages.nav.contact,
      icon: Mail,
    },
  ];
}

export function isMobileMoreActive(pathname: string): boolean {
  return (
    pathname === "/locations" ||
    pathname.startsWith("/locations/") ||
    pathname === "/about" ||
    pathname.startsWith("/about/") ||
    pathname === "/contact" ||
    pathname.startsWith("/contact/")
  );
}

export const MOBILE_BOTTOM_NAV_HIDE_PREFIXES = [
  "/spare-parts/checkout",
] as const;
