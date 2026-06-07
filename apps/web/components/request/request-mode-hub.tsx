"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import {
  ArrowLeft,
  ClipboardList,
  MessageCircle,
  Wrench,
  Zap,
} from "lucide-react";
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

        if (external && mode === "whatsapp" && !isActive) {
          return (
            <a key={mode} href={external} className={className}>
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

export function RequestModeHub() {
  const { messages: t } = useLocale();
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());
  const whatsappHref = useMemo(
    () => buildWhatsAppQuickContactUrl(getPublicWhatsAppDigits(), {}),
    [],
  );

  const cards = [
    {
      kind: "link" as const,
      mode: "full" as const,
      icon: Wrench,
      title: t.request.modes.fullTitle,
      description: t.request.modes.fullDescription,
      badge: t.request.modes.loginRequired,
      href: buildHref("full", params),
      accent: "primary" as const,
    },
    {
      kind: "link" as const,
      mode: "quick" as const,
      icon: Zap,
      title: t.request.modes.quickTitle,
      description: t.request.modes.quickDescription,
      badge: t.request.modes.noLogin,
      href: buildHref("quick", params),
      accent: "primary" as const,
    },
    {
      kind: "whatsapp" as const,
      mode: "whatsapp" as const,
      icon: MessageCircle,
      title: t.request.modes.whatsappTitle,
      description: t.request.modes.whatsappDescription,
      badge: t.request.modes.instant,
      href: whatsappHref,
      accent: "whatsapp" as const,
    },
  ];

  return (
    <section className="mx-auto grid w-[90%] max-w-5xl gap-5 pb-16 sm:grid-cols-3">
      {cards.map(
        ({ kind, icon: Icon, title, description, badge, href, accent }) => {
          const className = cn(
            "group flex h-full flex-col rounded-[20px] border p-6 transition-all",
            accent === "whatsapp"
              ? "border-[#25D366]/30 bg-[#091014] hover:border-[#25D366]/60 hover:shadow-[0_8px_32px_rgba(37,211,102,0.12)]"
              : "border-[#94D4B9]/10 bg-[#091014] hover:border-[#94D4B9]/30 hover:shadow-[0_8px_32px_rgba(148,212,185,0.08)]",
          );

          const inner = (
            <>
              <div className="mb-4 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex size-12 items-center justify-center rounded-xl",
                    accent === "whatsapp"
                      ? "bg-[#25D366]/15 text-[#25D366]"
                      : "bg-[#94D4B9]/10 text-[#94D4B9]",
                  )}
                >
                  <Icon className="size-6" aria-hidden />
                </span>
                <span className="rounded-full border border-[#94D4B9]/15 bg-[#050B10] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  {badge}
                </span>
              </div>
              <h2 className="text-lg font-bold">{title}</h2>
              <p className="mt-2 flex-1 text-sm leading-7 text-muted">
                {description}
              </p>
              <span
                className={cn(
                  "mt-5 inline-flex items-center gap-1.5 text-sm font-semibold",
                  accent === "whatsapp" ? "text-[#25D366]" : "text-[#94D4B9]",
                )}
              >
                {kind === "whatsapp" ? t.request.modes.openWhatsApp : t.request.modes.choose}
                <ArrowLeft className="size-4 opacity-80" aria-hidden />
              </span>
            </>
          );

          if (kind === "whatsapp") {
            return (
              <a key={title} href={href} className={className}>
                {inner}
              </a>
            );
          }

          return (
            <Link key={title} href={href} className={className}>
              {inner}
            </Link>
          );
        },
      )}
    </section>
  );
}
