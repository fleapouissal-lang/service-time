"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

export type RequestMode = "hub" | "full" | "quick" | "whatsapp";

function buildHref(mode: RequestMode, params: URLSearchParams): string {
  const next = new URLSearchParams(params);
  if (mode === "hub") {
    next.delete("mode");
  } else {
    next.set("mode", mode);
  }
  const qs = next.toString();
  return qs ? `/request?${qs}` : "/request";
}

export function RequestModeTabs({ active }: { active: RequestMode }) {
  const { messages: t } = useLocale();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const tabs: {
    mode: RequestMode;
    label: string;
    href?: string;
  }[] = [
    { mode: "full", label: t.request.modes.full },
    { mode: "quick", label: t.request.modes.quick },
    {
      mode: "whatsapp",
      label: t.nav.sparePartsShort,
      href: "/spare-parts",
    },
  ];

  return (
    <div className="mx-auto flex w-[90%] max-w-3xl flex-wrap justify-center gap-2">
      {tabs.map(({ mode, label, href }) => {
        const isActive = active === mode;
        const className = cn(
          "inline-flex h-11 items-center rounded-full px-5 text-sm font-semibold transition-colors",
          isActive
            ? "bg-[#94D4B9] text-[#050B10]"
            : "border border-[#94D4B9]/20 bg-[#091014] text-foreground hover:border-[#94D4B9]/40",
        );

        if (href) {
          return (
            <Link key={mode} href={href} className={className}>
              {label}
            </Link>
          );
        }

        return (
          <Link key={mode} href={buildHref(mode, params)} className={className}>
            {label}
          </Link>
        );
      })}
    </div>
  );
}

type HubCardProps = {
  title: string;
  description: string;
  badge: string;
  href: string;
  actionLabel: string;
};

function HubCard({
  title,
  description,
  badge,
  href,
  actionLabel,
}: HubCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex min-h-0 flex-col rounded-[20px] border border-[#94D4B9]/10 bg-[#091014] transition-all",
        "hover:border-[#94D4B9]/30 hover:shadow-[0_8px_32px_rgba(148,212,185,0.08)]",
        "max-md:min-h-[11rem] max-md:p-5",
        "md:h-full md:p-6",
      )}
    >
      <div className="flex shrink-0 justify-end">
        <span className="rounded-full border border-[#94D4B9]/15 bg-[#050B10] px-2.5 py-1 text-[11px] font-medium text-muted-foreground max-md:leading-tight md:text-xs">
          {badge}
        </span>
      </div>

      <div className="flex shrink-0 flex-col max-md:mt-3 max-md:gap-1.5 md:mt-3">
        <h2 className="line-clamp-2 font-bold max-md:text-base max-md:leading-6 md:text-lg">
          {title}
        </h2>
        <p className="line-clamp-3 text-muted max-md:text-sm max-md:leading-[1.45] md:mt-2 md:flex-1 md:text-sm md:leading-7">
          {description}
        </p>
      </div>

      <span
        className={cn(
          "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] font-semibold text-[#050B10] transition-opacity group-hover:opacity-90",
          "max-md:mt-4 max-md:h-11 max-md:px-4 max-md:text-sm",
          "md:mt-5 md:h-11 md:px-4 md:text-sm",
        )}
      >
        {actionLabel}
        <LocaleForwardArrow className="size-4 shrink-0" />
      </span>
    </Link>
  );
}

export function RequestModeHub() {
  const { messages: t } = useLocale();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  const cards: HubCardProps[] = [
    {
      title: t.request.modes.fullTitle,
      description: t.request.modes.fullDescription,
      badge: t.request.modes.loginRequired,
      href: buildHref("full", params),
      actionLabel: t.request.modes.choose,
    },
    {
      title: t.request.modes.quickTitle,
      description: t.request.modes.quickDescription,
      badge: t.request.modes.noLogin,
      href: buildHref("quick", params),
      actionLabel: t.request.modes.choose,
    },
    {
      title: t.spareParts.title,
      description: t.spareParts.description,
      badge: t.nav.sparePartsShort,
      href: "/spare-parts",
      actionLabel: t.spareParts.browseParts,
    },
  ];

  return (
    <section
      className={cn(
        "mx-auto grid w-[90%] max-w-5xl gap-5 pb-16 sm:grid-cols-3",
        "max-md:flex max-md:w-full max-md:max-w-none max-md:flex-col max-md:gap-4 max-md:px-3 max-md:pb-4 max-md:pt-14",
      )}
    >
      {cards.map((card) => (
        <HubCard key={card.title} {...card} />
      ))}
    </section>
  );
}
