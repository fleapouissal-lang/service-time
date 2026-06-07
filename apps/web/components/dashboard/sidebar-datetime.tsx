"use client";

import { useEffect, useState } from "react";
import { getIntlLocale } from "@/lib/i18n/config";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

export function SidebarDateTime({ compact = false }: { compact?: boolean }) {
  const { locale } = useLocale();
  const intlLocale = getIntlLocale(locale);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!now) {
    return (
      <div
        className={cn(
          "text-[#050B10]/50",
          compact ? "text-center text-[10px]" : "px-1 text-xs",
        )}
        aria-hidden
      >
        —
      </div>
    );
  }

  const date = now.toLocaleDateString(intlLocale, {
    weekday: compact ? undefined : "long",
    day: "numeric",
    month: compact ? "short" : "long",
    year: "numeric",
  });

  const time = now.toLocaleTimeString(intlLocale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  if (compact) {
    return (
      <div className="space-y-0.5 text-center text-[10px] leading-tight text-[#050B10]/70">
        <p className="font-medium tabular-nums">{time}</p>
        <p className="tabular-nums">{date}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-1 text-xs text-[#050B10]/70">
      <p className="font-medium">{date}</p>
      <p className="tabular-nums text-sm font-semibold text-[#050B10]/85">
        {time}
      </p>
    </div>
  );
}
