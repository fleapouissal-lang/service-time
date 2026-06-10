"use client";

import { useState } from "react";
import { FilterToggleButton } from "@/components/dashboard/filter-toggle-button";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type MobileFilterPanelProps = {
  children: React.ReactNode;
  active?: boolean;
  className?: string;
  panelClassName?: string;
  label?: string;
};

export function MobileFilterPanel({
  children,
  active = false,
  className,
  panelClassName,
  label,
}: MobileFilterPanelProps) {
  const [open, setOpen] = useState(false);
  const { messages: t } = useLocale();
  const filterLabel = label ?? t.common.filter;

  return (
    <div className={className}>
      <div
        key="filter-toggle"
        className={cn(
          "flex justify-end lg:hidden",
          open && "mb-3",
        )}
      >
        <FilterToggleButton
          open={open}
          onToggle={() => setOpen((value) => !value)}
          active={active}
          text={filterLabel}
          showLabel={filterLabel}
          hideLabel={t.common.hideFilters}
        />
      </div>

      <div
        key="filter-panel"
        className={cn(!open && "hidden lg:block", panelClassName)}
      >
        {children}
      </div>
    </div>
  );
}
