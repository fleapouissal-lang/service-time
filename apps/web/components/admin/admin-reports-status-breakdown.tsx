import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BAR_COLORS = [
  "bg-primary",
  "bg-[#6bb896]",
  "bg-[#3d5a4a]",
  "bg-[#7ab89a]",
  "bg-[#94D4B9]",
  "bg-[#050B10]",
];

type StatusBreakdownItem = {
  key: string;
  label: string;
  value: number;
};

type AdminReportsStatusBreakdownProps = {
  title: string;
  items: StatusBreakdownItem[];
  total: number;
  emptyLabel: string;
};

export function AdminReportsStatusBreakdown({
  title,
  items,
  total,
  emptyLabel,
}: AdminReportsStatusBreakdownProps) {
  const visible = items.filter((item) => item.value > 0);

  return (
    <Card className="h-full border-border/80 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">{emptyLabel}</p>
        ) : (
          <ul className="space-y-4">
            {visible.map((item, index) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const barColor = BAR_COLORS[index % BAR_COLORS.length];

              return (
                <li key={item.key}>
                  <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="min-w-[2rem] justify-center">
                        {item.value}
                      </Badge>
                      <span
                        className="min-w-[2.75rem] text-end text-xs font-medium text-muted"
                        dir="ltr"
                      >
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-muted/30">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
