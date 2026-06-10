"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  MessageCircle,
  Wrench,
  Zap,
} from "lucide-react";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import {
  buildWhatsAppQuickContactUrl,
  getPublicWhatsAppDigits,
} from "@/lib/whatsapp-utils";
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

  const whatsappHref = useMemo(
    () => buildWhatsAppQuickContactUrl(getPublicWhatsAppDigits(), {}),
    [],
  );

  const tabs: {
    mode: RequestMode;
    label: string;
    icon: typeof Wrench;
    external?: string;
  }[] = [
    { mode: "full", label: t.request.modes.full, icon: Wrench },
    { mode: "quick", label: t.request.modes.quick, icon: Zap },
    {
      mode: "whatsapp",
      label: t.request.modes.whatsapp,
      icon: MessageCircle,
      external: whatsappHref,
    },
  ];

  return (
    <div className="mx-auto flex w-[90%] max-w-3xl flex-wrap justify-center gap-2">
      {tabs.map(({ mode, label, icon: Icon, external }) => {
        const isActive = active === mode;
        const className = cn(
          "inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold transition-colors",
          isActive
            ? "bg-[#94D4B9] text-[#050B10]"
            : "border border-[#94D4B9]/20 bg-[#091014] text-foreground hover:border-[#94D4B9]/40",
          mode === "whatsapp" &&
            !isActive &&
            "border-[#25D366]/30 hover:border-[#25D366]/50",
        );

        if (external && mode === "whatsapp") {
          return (
            <a
              key={mode}
              href={external}
              className={cn(className, "max-md:hidden")}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {label}
            </a>
          );
        }

        return (
          <Link key={mode} href={buildHref(mode, params)} className={className}>
            <Icon className="size-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </div>
  );
}

type HubCardProps = {
  kind: "link" | "whatsapp";
  icon: typeof Wrench;
  title: string;
  description: string;
  badge: string;
  href: string;
  accent: "primary" | "whatsapp";
  actionLabel: string;
};

function HubCard({
  kind,
  icon: Icon,
  title,
  description,
  badge,
  href,
  accent,
  actionLabel,
}: HubCardProps) {
  const className = cn(
    "group flex min-h-0 flex-col rounded-[20px] border transition-all",
    "max-md:flex-1 max-md:justify-between max-md:p-3.5",
    "md:h-full md:p-6",
    accent === "whatsapp"
      ? "border-[#25D366]/30 bg-[#091014] hover:border-[#25D366]/60 hover:shadow-[0_8px_32px_rgba(37,211,102,0.12)]"
      : "border-[#94D4B9]/10 bg-[#091014] hover:border-[#94D4B9]/30 hover:shadow-[0_8px_32px_rgba(148,212,185,0.08)]",
  );

  const inner = (
    <>
      <div className="flex shrink-0 items-center justify-between gap-2 max-md:h-9 md:mb-4 md:items-start md:gap-3">
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-xl",
            "max-md:size-10 md:size-12",
            accent === "whatsapp"
              ? "bg-[#25D366]/15 text-[#25D366]"
              : "bg-[#94D4B9]/10 text-[#94D4B9]",
          )}
        >
          <Icon className="max-md:size-5 md:size-6" aria-hidden />
        </span>
        <span className="rounded-full border border-[#94D4B9]/15 bg-[#050B10] px-2 py-0.5 text-[10px] font-medium text-muted-foreground max-md:leading-tight md:px-2.5 md:py-1 md:text-xs">
          {badge}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-start max-md:mt-1 max-md:gap-1.5 md:mt-0">
        <h2 className="line-clamp-2 font-bold max-md:min-h-[2.5rem] max-md:text-[0.9375rem] max-md:leading-5 md:text-lg">
          {title}
        </h2>
        <p className="line-clamp-3 text-muted max-md:min-h-[3.5rem] max-md:text-[0.8125rem] max-md:leading-[1.35] md:mt-2 md:flex-1 md:text-sm md:leading-7">
          {description}
        </p>
      </div>

      <span
        className={cn(
          "inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[20px] bg-[#94D4B9] font-semibold text-[#050B10] transition-opacity group-hover:opacity-90",
          "max-md:mt-2 max-md:h-10 max-md:px-3 max-md:text-xs",
          "md:mt-5 md:h-11 md:px-4 md:text-sm",
        )}
      >
        {actionLabel}
        <LocaleForwardArrow className="size-4 shrink-0" />
      </span>
    </>
  );

  if (kind === "whatsapp") {
    return (
      <a href={href} className={cn(className, "max-md:hidden")}>
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {inner}
    </Link>
  );
}

export function RequestModeHub() {
  const { messages: t } = useLocale();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const whatsappHref = useMemo(
    () => buildWhatsAppQuickContactUrl(getPublicWhatsAppDigits(), {}),
    [],
  );

  const cards: HubCardProps[] = [
    {
      kind: "link",
      icon: Wrench,
      title: t.request.modes.fullTitle,
      description: t.request.modes.fullDescription,
      badge: t.request.modes.loginRequired,
      href: buildHref("full", params),
      accent: "primary",
      actionLabel: t.request.modes.choose,
    },
    {
      kind: "link",
      icon: Zap,
      title: t.request.modes.quickTitle,
      description: t.request.modes.quickDescription,
      badge: t.request.modes.noLogin,
      href: buildHref("quick", params),
      accent: "primary",
      actionLabel: t.request.modes.choose,
    },
    {
      kind: "whatsapp",
      icon: MessageCircle,
      title: t.request.modes.whatsappTitle,
      description: t.request.modes.whatsappDescription,
      badge: t.request.modes.instant,
      href: whatsappHref,
      accent: "whatsapp",
      actionLabel: t.request.modes.openWhatsApp,
    },
  ];

  return (
    <section
      className={cn(
        "mx-auto grid w-[90%] max-w-5xl gap-5 pb-16 sm:grid-cols-3",
        "max-md:flex max-md:h-[calc(100dvh-3.5rem-5.25rem-env(safe-area-inset-bottom))] max-md:w-full max-md:max-w-none max-md:flex-col max-md:gap-2 max-md:overflow-hidden max-md:px-3 max-md:pb-1 max-md:pt-14",
      )}
    >
      {cards.map((card) => (
        <HubCard key={card.title} {...card} />
      ))}
    </section>
  );
}
