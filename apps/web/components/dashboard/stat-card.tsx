import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  accent = false,
  className,
}: StatCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-3 sm:p-5">
        <div className="flex items-start justify-between gap-2 sm:gap-3">
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-xs text-muted sm:text-sm">{label}</p>
            <p
              className={cn(
                "mt-1 text-xl font-bold tracking-tight sm:text-3xl",
                accent && "text-primary",
              )}
            >
              {value}
            </p>
            {hint ? (
              <p className="mt-1 line-clamp-2 text-[10px] text-muted sm:text-xs">{hint}</p>
            ) : null}
          </div>
          {Icon ? (
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10">
              <Icon className="size-4 sm:size-5" aria-hidden />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
