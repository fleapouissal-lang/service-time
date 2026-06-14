"use client";

import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

const NOTCH_HALF = 48;
const MINT = "#94D4B9";

export function SidebarEdgeToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const { locale, messages: t } = useLocale();
  const isRtl = locale === "ar";
  const toggleLabel = open
    ? t.dashboard.common.collapseSidebar
    : t.dashboard.common.expandSidebar;

  const CollapseIcon = isRtl ? ChevronsRight : ChevronsLeft;
  const ExpandIcon = isRtl ? ChevronsLeft : ChevronsRight;
  const Icon = open ? CollapseIcon : ExpandIcon;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-y-0 z-40",
        isRtl ? "left-0" : "right-0",
      )}
      style={{ width: 0 }}
    >
      <div
        className={cn(
          "pointer-events-auto absolute top-1/2 -translate-y-1/2",
          isRtl ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2",
        )}
        style={{ width: 36, height: NOTCH_HALF * 2 }}
      >
        <div
          className={cn(
            "absolute top-1/2 h-16 w-5 -translate-y-1/2 bg-[#94D4B9]",
            isRtl ? "right-0" : "left-0",
          )}
          aria-hidden
        />

        <div
          className={cn(
            "absolute top-1/2 z-10 -translate-y-1/2",
            isRtl
              ? "right-1/2 translate-x-1/2"
              : "left-1/2 -translate-x-1/2",
          )}
        >
          <button
            type="button"
            onClick={onToggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            aria-expanded={open}
            className={cn(
              "flex size-11 items-center justify-center rounded-full",
              "border-2 border-[#94D4B9]/40 bg-[#050B10]",
              "shadow-[0_4px_14px_rgba(5,11,16,0.35)]",
              "transition-all duration-300 hover:scale-105 hover:border-[#94D4B9]/70 active:scale-95",
            )}
          >
            <Icon
              className="size-5 transition-transform duration-300 ease-out"
              style={{ color: MINT }}
              strokeWidth={2.5}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}
