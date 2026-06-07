"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ChartDatum, TrendDatum } from "@/lib/dashboard-analytics";

const CHART_COLORS = [
  "#94D4B9",
  "#6bb896",
  "#3d5a4a",
  "#c8ebe0",
  "#7ab89a",
  "#050B10",
];

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number; name?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-md">
      {label ? <p className="mb-1 text-muted">{label}</p> : null}
      <p className="font-semibold text-foreground">
        {payload[0]?.name ? `${payload[0].name}: ` : ""}
        {payload[0]?.value}
      </p>
    </div>
  );
}

type ChartCardProps = {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
};

function ChartCard({ title, children, className, headerAction }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{title}</CardTitle>
          {headerAction}
        </div>
      </CardHeader>
      <CardContent className="pb-4">{children}</CardContent>
    </Card>
  );
}

export function StatusDonutChart({
  data,
  title = "توزيع الحالات",
  headerAction,
}: {
  data: ChartDatum[];
  title?: string;
  headerAction?: React.ReactNode;
}) {
  if (data.length === 0) {
    return (
      <ChartCard title={title} headerAction={headerAction}>
        <p className="py-12 text-center text-sm text-muted">لا توجد بيانات</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} headerAction={headerAction}>
      <div className="h-[260px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={3}
            >
              {data.map((entry, i) => (
                <Cell
                  key={entry.key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 space-y-1.5 text-sm">
        {data.map((item, i) => (
          <li key={item.key} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2 text-muted">
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
                }}
              />
              {item.name}
            </span>
            <span className="font-semibold">{item.value}</span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}

export function WeeklyTrendChart({
  data,
  title = "الطلبات — آخر 7 أيام",
  headerAction,
}: {
  data: TrendDatum[];
  title?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <ChartCard title={title} headerAction={headerAction}>
      <div className="h-[260px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,212,185,0.15)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<ChartTooltip />} />
            <Line
              type="monotone"
              dataKey="count"
              name="طلبات"
              stroke="#94D4B9"
              strokeWidth={2.5}
              dot={{ fill: "#94D4B9", r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function ServiceTypeBarChart({
  data,
  title = "حسب نوع الخدمة",
  headerAction,
}: {
  data: ChartDatum[];
  title?: string;
  headerAction?: React.ReactNode;
}) {
  if (data.length === 0) {
    return (
      <ChartCard title={title} headerAction={headerAction}>
        <p className="py-12 text-center text-sm text-muted">لا توجد بيانات</p>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={title} headerAction={headerAction}>
      <div className="h-[240px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,212,185,0.15)" />
            <XAxis
              dataKey="name"
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: "var(--muted)", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={28}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="عدد" radius={[6, 6, 0, 0]}>
              {data.map((entry, i) => (
                <Cell
                  key={entry.key}
                  fill={CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function PriorityBarChart({
  data,
  title = "توزيع الأولويات",
  headerAction,
}: {
  data: ChartDatum[];
  title?: string;
  headerAction?: React.ReactNode;
}) {
  return (
    <ChartCard title={title} headerAction={headerAction}>
      <div className="h-[240px] w-full" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 8, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,212,185,0.15)" horizontal={false} />
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fill: "var(--muted)", fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={72}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar dataKey="value" name="عدد" radius={[0, 6, 6, 0]} fill="#94D4B9" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
}

export function KpiInsightsCard({
  items,
  title = "تحليل سريع",
  headerAction,
}: {
  title?: string;
  items: { label: string; value: string | number }[];
  headerAction?: React.ReactNode;
}) {
  return (
    <ChartCard title={title} headerAction={headerAction}>
      <dl className="space-y-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <dt className="text-sm text-muted">{item.label}</dt>
            <dd className="text-lg font-bold text-primary">{item.value}</dd>
          </div>
        ))}
      </dl>
    </ChartCard>
  );
}
