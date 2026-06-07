"use client";

import { ChevronsRight } from "lucide-react";
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
  const { messages: t } = useLocale();
  const toggleLabel = open
    ? t.dashboard.common.collapseSidebar
    : t.dashboard.common.expandSidebar;

  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-40"
      style={{ width: 0 }}
    >
      <div
        className="absolute left-0 w-[2px] -translate-x-1/2 bg-[#050B10]/15"
        style={{
          top: 0,
          height: `calc(50% - ${NOTCH_HALF}px)`,
        }}
      />

      <div
        className="absolute left-0 w-[2px] -translate-x-1/2 bg-[#050B10]/15"
        style={{
          bottom: 0,
          height: `calc(50% - ${NOTCH_HALF}px)`,
        }}
      />

      <div
        className="pointer-events-auto absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2"
        style={{ width: 36, height: NOTCH_HALF * 2 }}
      >
        <div
          className="absolute top-1/2 right-0 h-16 w-5 -translate-y-1/2 bg-[#94D4B9]"
          aria-hidden
        />

        <div className="absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
          <button
            type="button"
            onClick={onToggle}
            aria-label={toggleLabel}
            title={toggleLabel}
            className={cn(
              "flex size-11 items-center justify-center rounded-full",
              "border-2 border-[#94D4B9]/40 bg-[#050B10]",
              "shadow-[0_4px_14px_rgba(5,11,16,0.35)]",
              "transition-all duration-300 hover:scale-105 hover:border-[#94D4B9]/70 active:scale-95",
            )}
          >
            <ChevronsRight
              className={cn(
                "size-5 transition-transform duration-300 ease-out",
                !open && "scale-x-[-1]",
              )}
              style={{ color: MINT }}
              strokeWidth={2.5}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
