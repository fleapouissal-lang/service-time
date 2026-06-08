"use client";

import type { RequestStatusHistory } from "@service-time/types";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getStatusLabels } from "@/lib/i18n/labels";
import { STATUS_ORDER } from "@/lib/constants";
import { useLocale } from "@/lib/i18n/locale-context";
import { cn } from "@/lib/utils";

type OrderStatusStepsProps = {
  currentStatus: string;
  history?: RequestStatusHistory[];
  variant?: "horizontal" | "vertical";
  className?: string;
};

export function OrderStatusSteps({
  currentStatus,
  history = [],
  variant = "horizontal",
  className,
}: OrderStatusStepsProps) {
  const { messages: t } = useLocale();
  const statusLabels = getStatusLabels(t);
  const historyStatuses = new Set(history.map((entry) => entry.status as string));
  const isCancelled = currentStatus === "cancelled";

  if (isCancelled) {
    return (
      <Badge variant="outline" className={cn("text-red-600", className)}>
        {statusLabels.cancelled}
      </Badge>
    );
  }

  const currentIndex = STATUS_ORDER.indexOf(
    currentStatus as (typeof STATUS_ORDER)[number],
  );

  if (variant === "vertical") {
    return (
      <ol className={cn("space-y-0", className)}>
        {STATUS_ORDER.map((status, index) => {
          const done = historyStatuses.has(status) || index <= currentIndex;
          const active = status === currentStatus;

          return (
            <li key={status} className="flex gap-3">
              <div className="flex flex-col items-center">
                {done ? (
                  <CheckCircle2
                    className={cn(
                      "size-5",
                      active ? "text-primary" : "text-muted",
                    )}
                  />
                ) : (
                  <Circle className="size-5 text-slate-300" />
                )}
                {index < STATUS_ORDER.length - 1 ? (
                  <div
                    className={cn(
                      "my-1 min-h-[24px] w-0.5 flex-1",
                      done ? "bg-primary/40" : "bg-slate-200",
                    )}
                  />
                ) : null}
              </div>
              <div className="pb-5">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    active && "text-primary",
                    !done && "text-slate-400",
                  )}
                >
                  {statusLabels[status]}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }

  return (
    <ol
      className={cn(
        "grid grid-cols-5 gap-1 sm:gap-2",
        className,
      )}
      aria-label={t.tracking.timelineTitle}
    >
      {STATUS_ORDER.map((status, index) => {
        const done = historyStatuses.has(status) || index <= currentIndex;
        const active = status === currentStatus;

        return (
          <li key={status} className="flex min-w-0 flex-col items-center text-center">
            <div className="flex w-full items-center">
              {index > 0 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    index <= currentIndex || historyStatuses.has(STATUS_ORDER[index - 1]!)
                      ? "bg-primary/40"
                      : "bg-slate-200",
                  )}
                  aria-hidden
                />
              ) : (
                <span className="flex-1" aria-hidden />
              )}
              {done ? (
                <CheckCircle2
                  className={cn(
                    "size-4 shrink-0 sm:size-5",
                    active ? "text-primary" : "text-muted",
                  )}
                  aria-hidden
                />
              ) : (
                <Circle className="size-4 shrink-0 text-slate-300 sm:size-5" aria-hidden />
              )}
              {index < STATUS_ORDER.length - 1 ? (
                <div
                  className={cn(
                    "h-0.5 flex-1",
                    done ? "bg-primary/40" : "bg-slate-200",
                  )}
                  aria-hidden
                />
              ) : (
                <span className="flex-1" aria-hidden />
              )}
            </div>
            <p
              className={cn(
                "mt-1.5 line-clamp-2 w-full text-[10px] font-medium leading-tight sm:text-xs",
                active && "text-primary",
                !done && "text-slate-400",
                done && !active && "text-muted",
              )}
            >
              {statusLabels[status]}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
