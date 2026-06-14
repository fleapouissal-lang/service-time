"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import { LocaleForwardArrow } from "@/components/ui/locale-arrows";
import {
  buildWhatsAppQuickContactUrl,
  getPublicWhatsAppDigits,
} from "@/lib/whatsapp-utils";
import {
  requestCardBtnClass,
  requestCardBadgeClass,
  requestCardDescClass,
  requestCardInteractiveClass,
  requestCardTitleClass,
  requestTabActiveClass,
  requestTabClass,
} from "@/lib/request-styles";
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
    href?: string;
    external?: string;
  }[] = [
    { mode: "full", label: t.request.modes.full },
    { mode: "quick", label: t.request.modes.quick },
    {
      mode: "whatsapp",
      label: t.request.modes.whatsapp,
      external: whatsappHref,
    },
  ];

  return (
    <div className="mx-auto flex w-[90%] max-w-3xl flex-wrap justify-center gap-2">
      {tabs.map(({ mode, label, href, external }) => {
        const isActive = active === mode;
        const className = cn(
          requestTabClass,
          isActive && requestTabActiveClass,
          mode === "whatsapp" &&
            !isActive &&
            "border-[#25D366]/30 hover:border-[#25D366]/50",
        );

        if (external) {
          return (
            <a
              key={mode}
              href={external}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(className, "max-md:hidden")}
            >
              {label}
            </a>
          );
        }

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
  external?: boolean;
  accent?: "primary" | "whatsapp";
};

function HubCard({
  title,
  description,
  badge,
  href,
  actionLabel,
  external = false,
  accent = "primary",
}: HubCardProps) {
  const { locale } = useLocale();
  const isRtl = locale === "ar";

  const className = cn(
    "request-hub-card group relative flex min-h-0 flex-col text-start transition-all",
    requestCardInteractiveClass,
    "max-md:min-h-[11rem] max-md:p-5 md:h-full md:p-6",
    accent === "whatsapp" && "request-hub-card--whatsapp",
  );

  const inner = (
    <>
      <span
        className={cn(
          requestCardBadgeClass,
          "absolute top-4 start-4 z-10 rounded-full px-2.5 py-1 text-[11px] font-semibold max-md:leading-tight md:top-6 md:start-6 md:text-xs",
        )}
      >
        {badge}
      </span>

      <h2
        className={cn(
          requestCardTitleClass,
          "mt-10 line-clamp-2 max-md:mt-9 max-md:text-base max-md:leading-6 md:mt-11 md:text-lg md:leading-7",
        )}
      >
        {title}
      </h2>

      <p
        className={cn(
          requestCardDescClass,
          "mt-2 line-clamp-3 flex-1 max-md:text-sm max-md:leading-[1.45] md:text-sm md:leading-7",
        )}
      >
        {description}
      </p>

      <span
        className={cn(
          requestCardBtnClass,
          "mt-4 max-md:h-11 max-md:px-4 max-md:text-sm md:mt-5 md:h-11 md:px-4 md:text-sm",
        )}
      >
        {actionLabel}
        <LocaleForwardArrow className="size-4 shrink-0" />
      </span>
    </>
  );

  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        dir={isRtl ? "rtl" : "ltr"}
      >
        {inner}
      </a>
    );
  }

  return (
    <Link href={href} className={className} dir={isRtl ? "rtl" : "ltr"}>
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
      title: t.request.modes.whatsappTitle,
      description: t.request.modes.whatsappDescription,
      badge: t.request.modes.instant,
      href: whatsappHref,
      actionLabel: t.request.modes.openWhatsApp,
      external: true,
      accent: "whatsapp",
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
