import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, LayoutGrid, MapPin, Settings } from "lucide-react";
import { getServerI18n } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

type LinkKey = "dashboard" | "track" | "settings";

const LINKS: Record<
  LinkKey,
  { href: string; icon: LucideIcon; labelKey: LinkKey }
> = {
  dashboard: { href: "/client", icon: LayoutGrid, labelKey: "dashboard" },
  track: { href: "/client/track", icon: MapPin, labelKey: "track" },
  settings: { href: "/client/settings", icon: Settings, labelKey: "settings" },
};

type ClientAccountLinksProps = {
  items: LinkKey[];
  className?: string;
};

export async function ClientAccountLinks({
  items,
  className,
}: ClientAccountLinksProps) {
  const { t } = await getServerI18n();
  const labels = {
    dashboard: t.mobileNav.dashboard,
    track: t.dashboard.client.track,
    settings: t.mobileNav.accountSettings,
  };

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] shadow-[0_4px_24px_rgba(148,212,185,0.06)]",
        className,
      )}
    >
      {items.map((key, index) => {
        const item = LINKS[key];
        const Icon = item.icon;

        return (
          <Link
            key={key}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-4 py-3.5 transition-colors active:bg-[#94D4B9]/8",
              index > 0 && "border-t border-[#94D4B9]/10",
            )}
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#94D4B9]/10">
              <Icon className="size-5 text-[#94D4B9]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1 text-start text-sm font-medium text-white">
              {labels[key]}
            </span>
            <ChevronLeft
              className="size-4 shrink-0 text-[#94D4B9]/70 rtl:rotate-180"
              aria-hidden
            />
          </Link>
        );
      })}
    </div>
  );
}
