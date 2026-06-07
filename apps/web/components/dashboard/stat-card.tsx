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
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted">{label}</p>
            <p
              className={cn(
                "mt-1 text-3xl font-bold tracking-tight",
                accent && "text-primary",
              )}
            >
              {value}
            </p>
            {hint ? (
              <p className="mt-1 text-xs text-muted">{hint}</p>
            ) : null}
          </div>
          {Icon ? (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
